const db = require('../config/db');
const { formatDate, daysRemaining } = require('../utils/helpers');

// ============================================================
// DASHBOARD
// ============================================================

/**
 * GET /api/admin/dashboard
 */
exports.getDashboard = (req, res) => {
  try {
    const messId = req.user.mess_id;
    const period = req.query.period || 'month';

    let dateFilter;
    if (period === 'today') {
      dateFilter = `date(created_at) = date('now')`;
    } else if (period === 'week') {
      dateFilter = `date(created_at) >= date('now', '-7 days')`;
    } else {
      dateFilter = `date(created_at) >= date('now', 'start of month')`;
    }

    const revenue = db.prepare(`
      SELECT COALESCE(SUM(total), 0) as total, COUNT(*) as count
      FROM orders WHERE mess_id = ? AND ${dateFilter} AND status NOT IN ('Cancelled','No-show')
    `).get(messId);

    const activeSubs = db.prepare(`
      SELECT COUNT(*) as count FROM subscriptions WHERE mess_id = ? AND status = 'active'
    `).get(messId);

    const avgRating = db.prepare('SELECT rating, reviews_count FROM messes WHERE id = ?').get(messId);

    const topDishes = db.prepare(`
      SELECT oi.name, SUM(oi.quantity) as total_ordered
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      WHERE o.mess_id = ? AND ${dateFilter}
      GROUP BY oi.name ORDER BY total_ordered DESC LIMIT 5
    `).all(messId);

    const mealTypeStats = db.prepare(`
      SELECT meal_type, COUNT(*) as count
      FROM orders WHERE mess_id = ? AND ${dateFilter}
      GROUP BY meal_type
    `).all(messId);

    const revenueTrend = db.prepare(`
      SELECT date(created_at) as date, COALESCE(SUM(total), 0) as revenue
      FROM orders
      WHERE mess_id = ? AND date(created_at) >= date('now', '-30 days') AND status NOT IN ('Cancelled','No-show')
      GROUP BY date(created_at) ORDER BY date ASC
    `).all(messId);

    res.json({
      revenue: revenue.total,
      orderCount: revenue.count,
      activeSubscribers: activeSubs.count,
      avgRating: avgRating?.rating || 0,
      reviewsCount: avgRating?.reviews_count || 0,
      topDishes,
      mealTypeStats,
      revenueTrend,
      period
    });
  } catch (err) {
    console.error('getDashboard error:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard.' });
  }
};

// ============================================================
// ORDERS
// ============================================================

/**
 * GET /api/admin/orders?status=Preparing
 */
exports.getOrders = (req, res) => {
  try {
    const messId = req.user.mess_id;
    const { status } = req.query;

    let query = `
      SELECT o.*, u.name as student_name, u.email as student_email
      FROM orders o
      JOIN users u ON u.id = o.user_id
      WHERE o.mess_id = ?
    `;
    const params = [messId];

    if (status) {
      query += ' AND o.status = ?';
      params.push(status);
    }

    query += ' ORDER BY o.created_at DESC';

    const orders = db.prepare(query).all(...params);

    const result = orders.map(order => {
      const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
      return {
        id: order.id,
        studentName: order.student_name,
        studentEmail: order.student_email,
        mealType: order.meal_type,
        slotTime: order.slot_time,
        orderType: order.order_type,
        items: items.map(i => ({ name: i.name, quantity: i.quantity, price: i.price })),
        total: order.total,
        status: order.status,
        paymentMethod: order.payment_method,
        notes: order.notes,
        createdAt: order.created_at
      };
    });

    res.json(result);
  } catch (err) {
    console.error('getOrders error:', err);
    res.status(500).json({ error: 'Failed to fetch orders.' });
  }
};

/**
 * PUT /api/admin/orders/:id/status
 */
exports.updateOrderStatus = (req, res) => {
  try {
    const { status } = req.body;
    const orderId = req.params.id;
    const validStatuses = ['Placed', 'Accepted', 'Preparing', 'Ready', 'Completed', 'Cancelled', 'No-show'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const order = db.prepare('SELECT * FROM orders WHERE id = ? AND mess_id = ?').get(orderId, req.user.mess_id);
    if (!order) return res.status(404).json({ error: 'Order not found.' });

    db.prepare("UPDATE orders SET status = ?, updated_at = datetime('now') WHERE id = ?").run(status, orderId);

    // Handle attendance on Completed or No-show
    if (status === 'Completed' && order.subscription_id) {
      db.prepare("INSERT INTO attendance (user_id, subscription_id, order_id, date, status) VALUES (?, ?, ?, date('now'), 'attended')")
        .run(order.user_id, order.subscription_id, orderId);
    }

    if (status === 'No-show' && order.subscription_id) {
      db.prepare("INSERT INTO attendance (user_id, subscription_id, order_id, date, status) VALUES (?, ?, ?, date('now'), 'no-show')")
        .run(order.user_id, order.subscription_id, orderId);

      // Increment no-show count + deduct meal
      const sub = db.prepare('SELECT * FROM subscriptions WHERE id = ?').get(order.subscription_id);
      if (sub) {
        db.prepare('UPDATE subscriptions SET no_show_count = no_show_count + 1, meals_remaining = MAX(0, meals_remaining - 1) WHERE id = ?')
          .run(sub.id);

        if (sub.no_show_count + 1 >= sub.max_no_shows) {
          db.prepare("UPDATE subscriptions SET status = 'cancelled' WHERE id = ?").run(sub.id);
          db.prepare("INSERT INTO notifications (user_id, type, message) VALUES (?, 'error', ?)")
            .run(order.user_id, 'Your subscription has been cancelled due to excessive no-shows.');
        } else {
          db.prepare("INSERT INTO notifications (user_id, type, message) VALUES (?, 'error', ?)")
            .run(order.user_id, `No-show detected for order #${orderId}. 1 meal deducted from your plan.`);
        }
      }
    }

    // Notify student on status changes
    const statusMessages = {
      'Accepted': `Your order #${orderId} was accepted!`,
      'Preparing': `Your order #${orderId} is being prepared.`,
      'Ready': `Your food for order #${orderId} is ready for pickup!`,
      'Completed': `Order #${orderId} completed. Rate your meal!`,
      'Cancelled': `Your order #${orderId} was cancelled.`
    };

    if (statusMessages[status]) {
      const notifType = status === 'Cancelled' ? 'error' : 'success';
      db.prepare('INSERT INTO notifications (user_id, type, message) VALUES (?, ?, ?)')
        .run(order.user_id, notifType, statusMessages[status]);
    }

    res.json({ success: true, orderId, status });
  } catch (err) {
    console.error('updateOrderStatus error:', err);
    res.status(500).json({ error: 'Failed to update order status.' });
  }
};

// ============================================================
// MENU CRUD
// ============================================================

exports.getMenu = (req, res) => {
  try {
    const { meal_type } = req.query;
    let query = 'SELECT * FROM menu_items WHERE mess_id = ?';
    const params = [req.user.mess_id];
    if (meal_type) {
      query += ' AND meal_type = ?';
      params.push(meal_type.toLowerCase());
    }
    query += ' ORDER BY meal_type, name';
    const items = db.prepare(query).all(...params);
    res.json(items.map(i => ({
      id: i.id, name: i.name, price: i.price,
      mealType: i.meal_type, foodType: i.food_type, isAvailable: !!i.is_available
    })));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch menu.' });
  }
};

exports.addMenuItem = (req, res) => {
  try {
    const { id, name, price, mealType, foodType } = req.body;
    if (!id || !name || !price || !mealType) return res.status(400).json({ error: 'Missing fields.' });

    db.prepare('INSERT INTO menu_items (id, mess_id, name, price, meal_type, food_type) VALUES (?, ?, ?, ?, ?, ?)')
      .run(id, req.user.mess_id, name, price, mealType, foodType || 'veg');

    res.status(201).json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add menu item.' });
  }
};

exports.updateMenuItem = (req, res) => {
  try {
    const { name, price, foodType, isAvailable } = req.body;
    db.prepare(`
      UPDATE menu_items SET
        name = COALESCE(?, name), price = COALESCE(?, price),
        food_type = COALESCE(?, food_type), is_available = COALESCE(?, is_available)
      WHERE id = ? AND mess_id = ?
    `).run(name, price, foodType, isAvailable !== undefined ? (isAvailable ? 1 : 0) : null, req.params.id, req.user.mess_id);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update menu item.' });
  }
};

exports.deleteMenuItem = (req, res) => {
  try {
    const itemId = req.params.id;
    const messId = req.user.mess_id;

    // Verify the item belongs to this mess
    const item = db.prepare('SELECT id FROM menu_items WHERE id = ? AND mess_id = ?').get(itemId, messId);
    if (!item) return res.status(404).json({ error: 'Menu item not found.' });

    // Wrap in a transaction: remove FK references first, then delete the item
    const deleteItem = db.transaction(() => {
      // Nullify menu_item_id in reviews (preserves review history without the FK)
      db.prepare('UPDATE reviews SET menu_item_id = NULL WHERE menu_item_id = ?').run(itemId);
      // Delete order_items rows (name & price are already denormalized on each row)
      db.prepare('DELETE FROM order_items WHERE menu_item_id = ?').run(itemId);
      // Now safe to delete the menu item
      db.prepare('DELETE FROM menu_items WHERE id = ? AND mess_id = ?').run(itemId, messId);
    });

    deleteItem();
    res.json({ success: true });
  } catch (err) {
    console.error('deleteMenuItem error:', err);
    res.status(500).json({ error: 'Failed to delete menu item.' });
  }
};

exports.toggleMenuAvailability = (req, res) => {
  try {
    const item = db.prepare('SELECT is_available FROM menu_items WHERE id = ? AND mess_id = ?')
      .get(req.params.id, req.user.mess_id);
    if (!item) return res.status(404).json({ error: 'Menu item not found.' });

    const newState = item.is_available ? 0 : 1;
    db.prepare('UPDATE menu_items SET is_available = ? WHERE id = ? AND mess_id = ?')
      .run(newState, req.params.id, req.user.mess_id);

    res.json({ success: true, isAvailable: !!newState });
  } catch (err) {
    res.status(500).json({ error: 'Failed to toggle menu availability.' });
  }
};

// ============================================================
// SLOTS CRUD
// ============================================================

exports.getSlots = (req, res) => {
  try {
    const slots = db.prepare('SELECT * FROM slots WHERE mess_id = ? ORDER BY meal_type, time').all(req.user.mess_id);
    res.json(slots);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch slots.' });
  }
};

exports.addSlot = (req, res) => {
  try {
    const { mealType, time, capacity } = req.body;
    if (!mealType || !time || !capacity) return res.status(400).json({ error: 'Missing fields.' });

    const result = db.prepare('INSERT INTO slots (mess_id, meal_type, time, capacity) VALUES (?, ?, ?, ?)')
      .run(req.user.mess_id, mealType, time, capacity);

    res.status(201).json({ success: true, id: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add slot.' });
  }
};

exports.updateSlot = (req, res) => {
  try {
    const { time, capacity } = req.body;
    db.prepare('UPDATE slots SET time = COALESCE(?, time), capacity = COALESCE(?, capacity) WHERE id = ? AND mess_id = ?')
      .run(time, capacity, req.params.id, req.user.mess_id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update slot.' });
  }
};

exports.deleteSlot = (req, res) => {
  try {
    db.prepare('DELETE FROM slots WHERE id = ? AND mess_id = ?').run(req.params.id, req.user.mess_id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete slot.' });
  }
};

// ============================================================
// SUBSCRIBERS
// ============================================================

exports.getSubscribers = (req, res) => {
  try {
    const { status } = req.query;
    let query = `
      SELECT s.*, u.name, u.email, p.name as plan_name
      FROM subscriptions s
      JOIN users u ON u.id = s.user_id
      JOIN plans p ON p.id = s.plan_id
      WHERE s.mess_id = ?
    `;
    const params = [req.user.mess_id];
    if (status && ['active','expired','cancelled'].includes(status)) {
      query += ' AND s.status = ?';
      params.push(status);
    }
    query += ' ORDER BY s.created_at DESC';

    const subs = db.prepare(query).all(...params);

    res.json(subs.map(s => {
      const days = daysRemaining(s.expires_at);
      const isExpiringSoon = s.status === 'active' && days <= 7;
      return {
        id: s.id, userId: s.user_id, name: s.name, email: s.email,
        plan: s.plan_name, mealsLeft: s.meals_remaining, noShows: s.no_show_count,
        maxNoShows: s.max_no_shows, status: s.status,
        isExpiringSoon, daysRemaining: days,
        expiresAt: formatDate(s.expires_at)
      };
    }));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch subscribers.' });
  }
};

exports.updateSubscriber = (req, res) => {
  try {
    const { action, days } = req.body;
    const subId = req.params.id;

    const sub = db.prepare('SELECT * FROM subscriptions WHERE id = ? AND mess_id = ?').get(subId, req.user.mess_id);
    if (!sub) return res.status(404).json({ error: 'Subscription not found.' });

    if (action === 'extend') {
      const extDays = days || 30;
      db.prepare(`UPDATE subscriptions SET expires_at = DATE(expires_at, '+${extDays} days'), status = 'active' WHERE id = ?`).run(subId);
      db.prepare("INSERT INTO notifications (user_id, type, message) VALUES (?, 'success', ?)")
        .run(sub.user_id, `Your subscription has been extended by ${extDays} days.`);
    } else if (action === 'cancel') {
      db.prepare("UPDATE subscriptions SET status = 'cancelled' WHERE id = ?").run(subId);
      db.prepare("INSERT INTO notifications (user_id, type, message) VALUES (?, 'warning', 'Your subscription has been cancelled by the mess owner.')")
        .run(sub.user_id);
    } else if (action === 'reset_no_shows') {
      db.prepare('UPDATE subscriptions SET no_show_count = 0 WHERE id = ?').run(subId);
    } else {
      return res.status(400).json({ error: 'Invalid action. Use: extend, cancel, reset_no_shows' });
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update subscriber.' });
  }
};

// ============================================================
// BILLING
// ============================================================

exports.getBilling = (req, res) => {
  try {
    const { type, status } = req.query;
    let query = `
      SELECT p.*, u.name as student_name, o.payment_method
      FROM payments p
      JOIN users u ON u.id = p.user_id
      LEFT JOIN orders o ON o.id = p.order_id
      WHERE p.user_id IN (SELECT DISTINCT user_id FROM orders WHERE mess_id = ?)
    `;
    const params = [req.user.mess_id];
    if (type === 'subscription') { query += " AND p.type = 'subscription'"; }
    else if (type === 'order') { query += " AND p.type = 'order'"; }
    if (status === 'captured') { query += " AND p.status = 'captured'"; }
    else if (status === 'failed') { query += " AND p.status = 'failed'"; }
    query += ' ORDER BY p.created_at DESC';

    const records = db.prepare(query).all(...params);
    res.json(records.map(r => ({
      id: r.razorpay_payment_id || `TXN-${r.id}`,
      date: r.created_at,
      student: r.student_name,
      type: r.type === 'subscription' ? 'Subscription' : 'Daily Meal',
      amount: r.amount,
      status: r.status === 'captured' ? 'Success' : r.status === 'failed' ? 'Failed' : 'Pending',
      remarks: r.remarks || '',
      paymentType: r.payment_method === 'Pay on Site' || r.remarks?.includes('Postpaid') ? 'Postpaid' : 'Online',
    })));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch billing records.' });
  }
};

exports.exportBillingCSV = (req, res) => {
  try {
    const records = db.prepare(`
      SELECT p.*, u.name as student_name
      FROM payments p
      JOIN users u ON u.id = p.user_id
      WHERE p.user_id IN (SELECT DISTINCT user_id FROM orders WHERE mess_id = ?)
      ORDER BY p.created_at DESC
    `).all(req.user.mess_id);

    const rows = records.map(r => [
      r.razorpay_payment_id || `TXN-${r.id}`,
      r.created_at.split('T')[0],
      r.student_name,
      r.type === 'subscription' ? 'Subscription' : 'Daily Meal',
      r.amount,
      r.status === 'captured' ? 'Success' : r.status === 'failed' ? 'Failed' : 'Pending'
    ].join(','));

    const csv = ['Transaction ID,Date,Student,Type,Amount,Status', ...rows].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="billing.csv"');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: 'Failed to export billing.' });
  }
};

// ============================================================
// REVIEWS
// ============================================================

exports.getReviews = (req, res) => {
  try {
    const reviews = db.prepare(`
      SELECT r.*, u.name as student_name, mi.name as dish_name
      FROM reviews r
      JOIN users u ON u.id = r.user_id
      JOIN menu_items mi ON mi.id = r.menu_item_id
      WHERE r.mess_id = ?
      ORDER BY r.created_at DESC
    `).all(req.user.mess_id);

    res.json(reviews.map(r => ({
      id: r.id, studentName: r.student_name, dishName: r.dish_name,
      rating: r.rating, comment: r.comment, createdAt: r.created_at
    })));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch reviews.' });
  }
};

// ============================================================
// ATTENDANCE
// ============================================================

exports.markAttendance = (req, res) => {
  try {
    const { status } = req.body; // 'attended' or 'no-show'
    const orderId = req.params.orderId;

    const order = db.prepare('SELECT * FROM orders WHERE id = ? AND mess_id = ?').get(orderId, req.user.mess_id);
    if (!order) return res.status(404).json({ error: 'Order not found.' });

    db.prepare("INSERT INTO attendance (user_id, subscription_id, order_id, date, status) VALUES (?, ?, ?, date('now'), ?)")
      .run(order.user_id, order.subscription_id, orderId, status);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark attendance.' });
  }
};

// ============================================================
// STUDENTS (list, profile, activate/deactivate)
// ============================================================

exports.getStudents = (req, res) => {
  try {
    const students = db.prepare(`
      SELECT u.id, u.name, u.email, u.phone, u.college, u.is_active,
        (SELECT COUNT(*) FROM orders WHERE user_id = u.id AND mess_id = ?) as order_count
      FROM users u
      WHERE u.role = 'student' AND u.id IN (
        SELECT DISTINCT user_id FROM orders WHERE mess_id = ?
        UNION
        SELECT DISTINCT user_id FROM subscriptions WHERE mess_id = ?
      )
      ORDER BY u.name
    `).all(req.user.mess_id, req.user.mess_id, req.user.mess_id);

    res.json(students);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch students.' });
  }
};

exports.getStudentProfile = (req, res) => {
  try {
    const student = db.prepare('SELECT id, name, email, phone, college, is_active FROM users WHERE id = ? AND role = ?')
      .get(req.params.id, 'student');
    if (!student) return res.status(404).json({ error: 'Student not found.' });

    const sub = db.prepare("SELECT * FROM subscriptions WHERE user_id = ? AND mess_id = ? AND status = 'active'")
      .get(student.id, req.user.mess_id);

    const recentOrders = db.prepare('SELECT id, status, total, created_at FROM orders WHERE user_id = ? AND mess_id = ? ORDER BY created_at DESC LIMIT 10')
      .all(student.id, req.user.mess_id);

    res.json({ ...student, subscription: sub || null, recentOrders });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch student profile.' });
  }
};

exports.toggleStudentStatus = (req, res) => {
  try {
    const { isActive } = req.body;
    db.prepare('UPDATE users SET is_active = ? WHERE id = ? AND role = ?').run(isActive ? 1 : 0, req.params.id, 'student');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update student status.' });
  }
};

// ============================================================
// MESS PROFILE (get + update)
// ============================================================

exports.getMess = (req, res) => {
  try {
    const mess = db.prepare('SELECT * FROM messes WHERE id = ?').get(req.user.mess_id);
    if (!mess) return res.status(404).json({ error: 'Mess not found.' });
    res.json(mess);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch mess.' });
  }
};

exports.updateMess = (req, res) => {
  try {
    const { name, location, contact, isOpen, hoursBreakfast, hoursLunch, hoursDinner, thumbnail, todaysSpecial } = req.body;
    db.prepare(`
      UPDATE messes SET
        name = COALESCE(?, name), location = COALESCE(?, location), contact = COALESCE(?, contact),
        is_open = COALESCE(?, is_open), hours_breakfast = COALESCE(?, hours_breakfast),
        hours_lunch = COALESCE(?, hours_lunch), hours_dinner = COALESCE(?, hours_dinner),
        thumbnail = COALESCE(?, thumbnail), todays_special = COALESCE(?, todays_special)
      WHERE id = ?
    `).run(name, location, contact, isOpen !== undefined ? (isOpen ? 1 : 0) : null, hoursBreakfast, hoursLunch, hoursDinner, thumbnail, todaysSpecial, req.user.mess_id);

    res.json({ success: true });
  } catch (err) {
    console.error('updateMess error:', err);
    res.status(500).json({ error: 'Failed to update mess.' });
  }
};

// ============================================================
// PLANS (full CRUD)
// ============================================================

exports.getPlans = (req, res) => {
  try {
    const plans = db.prepare('SELECT * FROM plans WHERE mess_id = ? ORDER BY price ASC').all(req.user.mess_id);
    res.json(plans.map(p => ({
      id: p.id, name: p.name, price: p.price,
      totalMeals: p.total_meals, mealTypes: JSON.parse(p.meal_types || '[]'),
      isRecommended: !!p.is_recommended
    })));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch plans.' });
  }
};

exports.addPlan = (req, res) => {
  try {
    const { name, price, totalMeals, mealTypes, isRecommended } = req.body;
    if (!name || !price || !totalMeals) return res.status(400).json({ error: 'Missing fields.' });
    const id = `p${Date.now()}`;
    db.prepare('INSERT INTO plans (id, mess_id, name, price, total_meals, meal_types, is_recommended) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(id, req.user.mess_id, name, price, totalMeals, JSON.stringify(mealTypes || []), isRecommended ? 1 : 0);
    res.status(201).json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add plan.' });
  }
};

exports.updatePlan = (req, res) => {
  try {
    const { name, price, totalMeals, mealTypes, isRecommended } = req.body;
    const plan = db.prepare('SELECT * FROM plans WHERE id = ? AND mess_id = ?').get(req.params.id, req.user.mess_id);
    if (!plan) return res.status(404).json({ error: 'Plan not found.' });

    db.prepare(`UPDATE plans SET name = COALESCE(?, name), price = COALESCE(?, price), 
      total_meals = COALESCE(?, total_meals), meal_types = COALESCE(?, meal_types),
      is_recommended = COALESCE(?, is_recommended) WHERE id = ?`)
      .run(name, price, totalMeals, mealTypes ? JSON.stringify(mealTypes) : null, 
        isRecommended !== undefined ? (isRecommended ? 1 : 0) : null, req.params.id);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update plan.' });
  }
};

exports.deletePlan = (req, res) => {
  try {
    // Don't delete if active subscriptions exist
    const activeSubs = db.prepare("SELECT COUNT(*) as count FROM subscriptions WHERE plan_id = ? AND status = 'active'").get(req.params.id);
    if (activeSubs.count > 0) {
      return res.status(400).json({ error: `Cannot delete: ${activeSubs.count} active subscriptions on this plan.` });
    }
    db.prepare('DELETE FROM plans WHERE id = ? AND mess_id = ?').run(req.params.id, req.user.mess_id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete plan.' });
  }
};

// ============================================================
// POSTPAID TRACKING
// ============================================================

/**
 * GET /api/admin/orders/postpaid
 */
exports.getPostpaidOrders = (req, res) => {
  try {
    const messId = req.user.mess_id;
    const orders = db.prepare(`
      SELECT o.*, u.name as student_name
      FROM orders o
      JOIN users u ON u.id = o.user_id
      WHERE o.mess_id = ? AND o.payment_method = 'Pay on Site'
      ORDER BY o.created_at DESC
    `).all(messId);

    const result = orders.map(order => {
      const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
      return {
        id: order.id,
        studentName: order.student_name,
        mealType: order.meal_type,
        slotTime: order.slot_time,
        orderType: order.order_type,
        items: items.map(i => ({ name: i.name, quantity: i.quantity, price: i.price })),
        total: order.total,
        status: order.status,
        paymentCollected: !!order.payment_collected,
        createdAt: order.created_at,
      };
    });

    const pending = result.filter(o => !o.paymentCollected && !['Cancelled', 'No-show'].includes(o.status));
    const collected = result.filter(o => o.paymentCollected);

    res.json({ pending, collected });
  } catch (err) {
    console.error('getPostpaidOrders error:', err);
    res.status(500).json({ error: 'Failed to fetch postpaid orders.' });
  }
};

/**
 * POST /api/admin/orders/:id/collect-payment
 */
exports.collectPostpaidPayment = (req, res) => {
  try {
    const orderId = req.params.id;
    const messId = req.user.mess_id;

    const order = db.prepare("SELECT * FROM orders WHERE id = ? AND mess_id = ? AND payment_method = 'Pay on Site'")
      .get(orderId, messId);

    if (!order) {
      return res.status(404).json({ error: 'Postpaid order not found.' });
    }
    if (order.payment_collected) {
      return res.status(400).json({ error: 'Payment already collected.' });
    }

    const collectTx = db.transaction(() => {
      // Mark order as collected
      db.prepare("UPDATE orders SET payment_collected = 1, updated_at = datetime('now') WHERE id = ?").run(orderId);

      // Insert payment record
      db.prepare(`
        INSERT INTO payments (order_id, user_id, mess_id, amount, type, status, remarks, created_at)
        VALUES (?, ?, ?, ?, 'order', 'captured', 'Postpaid - Cash Collected', datetime('now'))
      `).run(orderId, order.user_id, messId, order.total);
    });

    collectTx();

    res.json({ success: true, message: `₹${order.total} collected for order #${orderId}` });
  } catch (err) {
    console.error('collectPostpaidPayment error:', err);
    res.status(500).json({ error: 'Failed to collect payment.' });
  }
};
