const { query, getClient } = require('../config/db');
const { formatDate, daysRemaining } = require('../utils/helpers');
const bcrypt = require('bcryptjs');

// ============================================================
// DASHBOARD
// ============================================================

/**
 * GET /api/admin/dashboard
 */
exports.getDashboard = async (req, res) => {
  try {
    const messId = req.user.mess_id;
    const period = req.query.period || 'month';

    let dateFilter;
    if (period === 'today') {
      dateFilter = `created_at::date = CURRENT_DATE`;
    } else if (period === 'week') {
      dateFilter = `created_at::date >= CURRENT_DATE - INTERVAL '7 days'`;
    } else {
      dateFilter = `created_at::date >= DATE_TRUNC('month', CURRENT_DATE)`;
    }

    const { rows: revenueRows } = await query(`
      SELECT COALESCE(SUM(total), 0) as total, COUNT(*) as count
      FROM orders WHERE mess_id = $1 AND ${dateFilter} AND status NOT IN ('Cancelled','No-show')
    `, [messId]);
    const revenue = revenueRows[0];

    const { rows: activeSubRows } = await query(`
      SELECT COUNT(*) as count FROM subscriptions WHERE mess_id = $1 AND status = 'active'
    `, [messId]);
    const activeSubs = activeSubRows[0];

    const { rows: ratingRows } = await query('SELECT rating, reviews_count FROM messes WHERE id = $1', [messId]);
    const avgRating = ratingRows[0];

    const { rows: topDishes } = await query(`
      SELECT oi.name, SUM(oi.quantity) as total_ordered
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      WHERE o.mess_id = $1 AND ${dateFilter}
      GROUP BY oi.name ORDER BY total_ordered DESC LIMIT 5
    `, [messId]);

    const { rows: mealTypeStats } = await query(`
      SELECT meal_type, COUNT(*) as count
      FROM orders WHERE mess_id = $1 AND ${dateFilter}
      GROUP BY meal_type
    `, [messId]);

    const { rows: revenueTrend } = await query(`
      SELECT created_at::date as date, COALESCE(SUM(total), 0) as revenue
      FROM orders
      WHERE mess_id = $1 AND created_at::date >= CURRENT_DATE - INTERVAL '30 days' AND status NOT IN ('Cancelled','No-show')
      GROUP BY created_at::date ORDER BY date ASC
    `, [messId]);

    res.json({
      revenue: Number(revenue.total),
      orderCount: Number(revenue.count),
      activeSubscribers: Number(activeSubs.count),
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
exports.getOrders = async (req, res) => {
  try {
    const messId = req.user.mess_id;
    const { status } = req.query;

    let sql = `
      SELECT o.*, u.name as student_name, u.email as student_email
      FROM orders o
      JOIN users u ON u.id = o.user_id
      WHERE o.mess_id = $1
    `;
    const params = [messId];

    if (status) {
      sql += ` AND o.status = $${params.length + 1}`;
      params.push(status);
    }

    sql += ' ORDER BY o.created_at DESC';

    const { rows: orders } = await query(sql, params);

    const result = await Promise.all(orders.map(async order => {
      const { rows: items } = await query('SELECT * FROM order_items WHERE order_id = $1', [order.id]);
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
    }));

    res.json(result);
  } catch (err) {
    console.error('getOrders error:', err);
    res.status(500).json({ error: 'Failed to fetch orders.' });
  }
};

/**
 * PUT /api/admin/orders/:id/status
 */
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const orderId = req.params.id;
    const validStatuses = ['Placed', 'Accepted', 'Preparing', 'Ready', 'Completed', 'Cancelled', 'No-show'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const { rows: orderRows } = await query(
      'SELECT * FROM orders WHERE id = $1 AND mess_id = $2',
      [orderId, req.user.mess_id]
    );
    const order = orderRows[0];
    if (!order) return res.status(404).json({ error: 'Order not found.' });

    await query("UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2", [status, orderId]);

    // Handle attendance on Completed or No-show
    if (status === 'Completed' && order.subscription_id) {
      await query(
        "INSERT INTO attendance (user_id, subscription_id, order_id, date, status) VALUES ($1, $2, $3, CURRENT_DATE, 'attended')",
        [order.user_id, order.subscription_id, orderId]
      );
    }

    if (status === 'No-show') {
      // Always insert attendance record for any no-show
      if (order.subscription_id) {
        await query(
          "INSERT INTO attendance (user_id, subscription_id, order_id, date, status) VALUES ($1, $2, $3, CURRENT_DATE, 'no-show')",
          [order.user_id, order.subscription_id, orderId]
        );
      }

      // Penalty logic: only for postpaid (Pay on Site) orders
      if (order.payment_method === 'Pay on Site') {
        // Fetch active subscription by user_id and mess_id since postpaid orders have no subscription_id
        const { rows: subRows } = await query(
          "SELECT * FROM subscriptions WHERE user_id = $1 AND mess_id = $2 AND status = 'active'",
          [order.user_id, order.mess_id]
        );
        const sub = subRows[0];
        if (sub) {
          await query(
            'UPDATE subscriptions SET no_show_count = no_show_count + 1 WHERE id = $1',
            [sub.id]
          );

          const newCount = sub.no_show_count + 1;

          if (newCount >= sub.max_no_shows) {
            await query(
              "INSERT INTO notifications (user_id, type, message) VALUES ($1, 'error', $2)",
              [order.user_id, `Postpaid ordering blocked. You have missed ${newCount} orders. Limit is ${sub.max_no_shows}.`]
            );
          } else {
            await query(
              "INSERT INTO notifications (user_id, type, message) VALUES ($1, 'warning', $2)",
              [order.user_id, `No-show recorded (${newCount}/${sub.max_no_shows}). Postpaid blocked at ${sub.max_no_shows} misses.`]
            );
          }
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
      await query(
        'INSERT INTO notifications (user_id, type, message) VALUES ($1, $2, $3)',
        [order.user_id, notifType, statusMessages[status]]
      );
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

exports.getMenu = async (req, res) => {
  try {
    const { meal_type } = req.query;
    let sql = 'SELECT * FROM menu_items WHERE mess_id = $1';
    const params = [req.user.mess_id];
    if (meal_type) {
      sql += ` AND meal_type = $${params.length + 1}`;
      params.push(meal_type.toLowerCase());
    }
    sql += ' ORDER BY meal_type, name';
    const { rows: items } = await query(sql, params);
    res.json(items.map(i => ({
      id: i.id, name: i.name, price: i.price,
      mealType: i.meal_type, foodType: i.food_type, isAvailable: !!i.is_available
    })));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch menu.' });
  }
};

exports.addMenuItem = async (req, res) => {
  try {
    const { id, name, price, mealType, foodType } = req.body;
    if (!id || !name || !price || !mealType) return res.status(400).json({ error: 'Missing fields.' });

    await query(
      'INSERT INTO menu_items (id, mess_id, name, price, meal_type, food_type) VALUES ($1, $2, $3, $4, $5, $6)',
      [id, req.user.mess_id, name, price, mealType, foodType || 'veg']
    );

    res.status(201).json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add menu item.' });
  }
};

exports.updateMenuItem = async (req, res) => {
  try {
    const { name, price, foodType, isAvailable } = req.body;
    await query(`
      UPDATE menu_items SET
        name = COALESCE($1, name), price = COALESCE($2, price),
        food_type = COALESCE($3, food_type), is_available = COALESCE($4, is_available)
      WHERE id = $5 AND mess_id = $6
    `, [name, price, foodType, isAvailable !== undefined ? (isAvailable ? 1 : 0) : null, req.params.id, req.user.mess_id]);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update menu item.' });
  }
};

exports.deleteMenuItem = async (req, res) => {
  try {
    const itemId = req.params.id;
    const messId = req.user.mess_id;

    // Verify the item belongs to this mess
    const { rows: itemRows } = await query(
      'SELECT id FROM menu_items WHERE id = $1 AND mess_id = $2',
      [itemId, messId]
    );
    if (!itemRows[0]) return res.status(404).json({ error: 'Menu item not found.' });

    // Wrap in a transaction: remove FK references first, then delete the item
    const client = await getClient();
    try {
      await client.query('BEGIN');
      // Nullify menu_item_id in reviews (preserves review history without the FK)
      await client.query('UPDATE reviews SET menu_item_id = NULL WHERE menu_item_id = $1', [itemId]);
      // Delete order_items rows (name & price are already denormalized on each row)
      await client.query('DELETE FROM order_items WHERE menu_item_id = $1', [itemId]);
      // Now safe to delete the menu item
      await client.query('DELETE FROM menu_items WHERE id = $1 AND mess_id = $2', [itemId, messId]);
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }

    res.json({ success: true });
  } catch (err) {
    console.error('deleteMenuItem error:', err);
    res.status(500).json({ error: 'Failed to delete menu item.' });
  }
};

exports.toggleMenuAvailability = async (req, res) => {
  try {
    const { rows: itemRows } = await query(
      'SELECT is_available FROM menu_items WHERE id = $1 AND mess_id = $2',
      [req.params.id, req.user.mess_id]
    );
    const item = itemRows[0];
    if (!item) return res.status(404).json({ error: 'Menu item not found.' });

    const newState = item.is_available ? 0 : 1;
    await query(
      'UPDATE menu_items SET is_available = $1 WHERE id = $2 AND mess_id = $3',
      [newState, req.params.id, req.user.mess_id]
    );

    res.json({ success: true, isAvailable: !!newState });
  } catch (err) {
    res.status(500).json({ error: 'Failed to toggle menu availability.' });
  }
};

// ============================================================
// SLOTS CRUD
// ============================================================

exports.getSlots = async (req, res) => {
  try {
    const { rows: slots } = await query(
      'SELECT * FROM slots WHERE mess_id = $1 ORDER BY meal_type, time',
      [req.user.mess_id]
    );
    res.json(slots);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch slots.' });
  }
};

exports.addSlot = async (req, res) => {
  try {
    const { mealType, time, capacity } = req.body;
    if (!mealType || !time || !capacity) return res.status(400).json({ error: 'Missing fields.' });

    const { rows } = await query(
      'INSERT INTO slots (mess_id, meal_type, time, capacity) VALUES ($1, $2, $3, $4) RETURNING id',
      [req.user.mess_id, mealType, time, capacity]
    );

    res.status(201).json({ success: true, id: rows[0].id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add slot.' });
  }
};

exports.updateSlot = async (req, res) => {
  try {
    const { time, capacity } = req.body;
    await query(
      'UPDATE slots SET time = COALESCE($1, time), capacity = COALESCE($2, capacity) WHERE id = $3 AND mess_id = $4',
      [time, capacity, req.params.id, req.user.mess_id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update slot.' });
  }
};

exports.deleteSlot = async (req, res) => {
  try {
    await query(
      'DELETE FROM slots WHERE id = $1 AND mess_id = $2',
      [req.params.id, req.user.mess_id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete slot.' });
  }
};

// ============================================================
// SUBSCRIBERS
// ============================================================

exports.getSubscribers = async (req, res) => {
  try {
    const { status } = req.query;
    let sql = `
      SELECT s.*, u.name, u.email, p.name as plan_name
      FROM subscriptions s
      JOIN users u ON u.id = s.user_id
      JOIN plans p ON p.id = s.plan_id
      WHERE s.mess_id = $1
    `;
    const params = [req.user.mess_id];
    if (status && ['active','expired','cancelled'].includes(status)) {
      sql += ` AND s.status = $${params.length + 1}`;
      params.push(status);
    }
    sql += ' ORDER BY s.created_at DESC';

    const { rows: subs } = await query(sql, params);

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

exports.updateSubscriber = async (req, res) => {
  try {
    const { action, days } = req.body;
    const subId = req.params.id;

    const { rows: subRows } = await query(
      'SELECT * FROM subscriptions WHERE id = $1 AND mess_id = $2',
      [subId, req.user.mess_id]
    );
    const sub = subRows[0];
    if (!sub) return res.status(404).json({ error: 'Subscription not found.' });

    if (action === 'extend') {
      const extDays = days || 30;
      await query(
        `UPDATE subscriptions SET expires_at = expires_at + INTERVAL '${extDays} days', status = 'active' WHERE id = $1`,
        [subId]
      );
      await query(
        "INSERT INTO notifications (user_id, type, message) VALUES ($1, 'success', $2)",
        [sub.user_id, `Your subscription has been extended by ${extDays} days.`]
      );
    } else if (action === 'cancel') {
      await query("UPDATE subscriptions SET status = 'cancelled' WHERE id = $1", [subId]);
      await query(
        "INSERT INTO notifications (user_id, type, message) VALUES ($1, 'warning', 'Your subscription has been cancelled by the mess owner.')",
        [sub.user_id]
      );
    } else if (action === 'reset_no_shows') {
      await query('UPDATE subscriptions SET no_show_count = 0 WHERE id = $1', [subId]);
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

exports.getBilling = async (req, res) => {
  try {
    const { type, status } = req.query;
    let sql = `
      SELECT p.*, u.name as student_name, o.payment_method
      FROM payments p
      JOIN users u ON u.id = p.user_id
      LEFT JOIN orders o ON o.id = p.order_id
      WHERE p.user_id IN (SELECT DISTINCT user_id FROM orders WHERE mess_id = $1)
    `;
    const params = [req.user.mess_id];
    if (type === 'subscription') { sql += ` AND p.type = 'subscription'`; }
    else if (type === 'order') { sql += ` AND p.type = 'order'`; }
    if (status === 'captured') { sql += ` AND p.status = 'captured'`; }
    else if (status === 'failed') { sql += ` AND p.status = 'failed'`; }
    sql += ' ORDER BY p.created_at DESC';

    const { rows: records } = await query(sql, params);
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

exports.exportBillingCSV = async (req, res) => {
  try {
    const { rows: records } = await query(`
      SELECT p.*, u.name as student_name
      FROM payments p
      JOIN users u ON u.id = p.user_id
      WHERE p.user_id IN (SELECT DISTINCT user_id FROM orders WHERE mess_id = $1)
      ORDER BY p.created_at DESC
    `, [req.user.mess_id]);

    const rows = records.map(r => [
      r.razorpay_payment_id || `TXN-${r.id}`,
      r.created_at instanceof Date ? r.created_at.toISOString().split('T')[0] : r.created_at.split('T')[0],
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

exports.getReviews = async (req, res) => {
  try {
    const { rows: reviews } = await query(`
      SELECT r.*, u.name as student_name, mi.name as dish_name
      FROM reviews r
      JOIN users u ON u.id = r.user_id
      JOIN menu_items mi ON mi.id = r.menu_item_id
      WHERE r.mess_id = $1
      ORDER BY r.created_at DESC
    `, [req.user.mess_id]);

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

exports.markAttendance = async (req, res) => {
  try {
    const { status } = req.body; // 'attended' or 'no-show'
    const orderId = req.params.orderId;

    const { rows: orderRows } = await query(
      'SELECT * FROM orders WHERE id = $1 AND mess_id = $2',
      [orderId, req.user.mess_id]
    );
    const order = orderRows[0];
    if (!order) return res.status(404).json({ error: 'Order not found.' });

    await query(
      "INSERT INTO attendance (user_id, subscription_id, order_id, date, status) VALUES ($1, $2, $3, CURRENT_DATE, $4)",
      [order.user_id, order.subscription_id, orderId, status]
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark attendance.' });
  }
};

// ============================================================
// STUDENTS (list, profile, activate/deactivate)
// ============================================================

exports.getStudents = async (req, res) => {
  try {
    const { rows: students } = await query(`
      SELECT u.id, u.name, u.email, u.phone, u.college, u.is_active,
        (SELECT COUNT(*) FROM orders WHERE user_id = u.id AND mess_id = $1) as order_count
      FROM users u
      WHERE u.role = 'student' AND u.id IN (
        SELECT DISTINCT user_id FROM orders WHERE mess_id = $2
        UNION
        SELECT DISTINCT user_id FROM subscriptions WHERE mess_id = $3
      )
      ORDER BY u.name
    `, [req.user.mess_id, req.user.mess_id, req.user.mess_id]);

    res.json(students);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch students.' });
  }
};

exports.getStudentProfile = async (req, res) => {
  try {
    const { rows: studentRows } = await query(
      'SELECT id, name, email, phone, college, is_active FROM users WHERE id = $1 AND role = $2',
      [req.params.id, 'student']
    );
    const student = studentRows[0];
    if (!student) return res.status(404).json({ error: 'Student not found.' });

    const { rows: subRows } = await query(
      "SELECT * FROM subscriptions WHERE user_id = $1 AND mess_id = $2 AND status = 'active'",
      [student.id, req.user.mess_id]
    );
    const sub = subRows[0];

    const { rows: recentOrders } = await query(
      'SELECT id, status, total, created_at FROM orders WHERE user_id = $1 AND mess_id = $2 ORDER BY created_at DESC LIMIT 10',
      [student.id, req.user.mess_id]
    );

    res.json({ ...student, subscription: sub || null, recentOrders });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch student profile.' });
  }
};

exports.toggleStudentStatus = async (req, res) => {
  try {
    const { isActive } = req.body;
    await query(
      'UPDATE users SET is_active = $1 WHERE id = $2 AND role = $3',
      [isActive ? 1 : 0, req.params.id, 'student']
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update student status.' });
  }
};

// ============================================================
// MESS PROFILE (get + update)
// ============================================================

exports.getMess = async (req, res) => {
  try {
    const { rows } = await query('SELECT * FROM messes WHERE id = $1', [req.user.mess_id]);
    const mess = rows[0];
    if (!mess) return res.status(404).json({ error: 'Mess not found.' });
    res.json(mess);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch mess.' });
  }
};

exports.updateMess = async (req, res) => {
  try {
    const { name, location, contact, isOpen, hoursBreakfast, hoursLunch, hoursDinner, thumbnail, todaysSpecial } = req.body;
    await query(`
      UPDATE messes SET
        name = COALESCE($1, name), location = COALESCE($2, location), contact = COALESCE($3, contact),
        is_open = COALESCE($4, is_open), hours_breakfast = COALESCE($5, hours_breakfast),
        hours_lunch = COALESCE($6, hours_lunch), hours_dinner = COALESCE($7, hours_dinner),
        thumbnail = COALESCE($8, thumbnail), todays_special = COALESCE($9, todays_special)
      WHERE id = $10
    `, [name, location, contact, isOpen !== undefined ? (isOpen ? 1 : 0) : null, hoursBreakfast, hoursLunch, hoursDinner, thumbnail, todaysSpecial, req.user.mess_id]);

    res.json({ success: true });
  } catch (err) {
    console.error('updateMess error:', err);
    res.status(500).json({ error: 'Failed to update mess.' });
  }
};

// ============================================================
// PLANS (full CRUD)
// ============================================================

exports.getPlans = async (req, res) => {
  try {
    const { rows: plans } = await query(
      'SELECT * FROM plans WHERE mess_id = $1 ORDER BY price ASC',
      [req.user.mess_id]
    );
    res.json(plans.map(p => ({
      id: p.id, name: p.name, price: p.price,
      totalMeals: p.total_meals, mealTypes: p.meal_types ? p.meal_types.split(',') : [],
      isRecommended: !!p.is_recommended
    })));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch plans.' });
  }
};

exports.addPlan = async (req, res) => {
  try {
    const { name, price, totalMeals, mealTypes, isRecommended } = req.body;
    if (!name || !price || !totalMeals) return res.status(400).json({ error: 'Missing fields.' });
    const id = `p${Date.now()}`;
    await query(
      'INSERT INTO plans (id, mess_id, name, price, total_meals, meal_types, is_recommended) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [id, req.user.mess_id, name, price, totalMeals, Array.isArray(mealTypes) ? mealTypes.join(',') : (mealTypes || ''), isRecommended ? 1 : 0]
    );
    res.status(201).json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add plan.' });
  }
};

exports.updatePlan = async (req, res) => {
  try {
    const { name, price, totalMeals, mealTypes, isRecommended } = req.body;
    const { rows: planRows } = await query(
      'SELECT * FROM plans WHERE id = $1 AND mess_id = $2',
      [req.params.id, req.user.mess_id]
    );
    if (!planRows[0]) return res.status(404).json({ error: 'Plan not found.' });

    await query(`UPDATE plans SET name = COALESCE($1, name), price = COALESCE($2, price), 
      total_meals = COALESCE($3, total_meals), meal_types = COALESCE($4, meal_types),
      is_recommended = COALESCE($5, is_recommended) WHERE id = $6`,
      [name, price, totalMeals, mealTypes ? mealTypes.join(',') : null,
        isRecommended !== undefined ? (isRecommended ? 1 : 0) : null, req.params.id]
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update plan.' });
  }
};

exports.deletePlan = async (req, res) => {
  try {
    // Don't delete if active subscriptions exist
    const { rows: activeSubRows } = await query(
      "SELECT COUNT(*) as count FROM subscriptions WHERE plan_id = $1 AND status = 'active'",
      [req.params.id]
    );
    const activeSubs = activeSubRows[0];
    if (parseInt(activeSubs.count) > 0) {
      return res.status(400).json({ error: `Cannot delete: ${activeSubs.count} active subscriptions on this plan.` });
    }
    await query('DELETE FROM plans WHERE id = $1 AND mess_id = $2', [req.params.id, req.user.mess_id]);
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
exports.getPostpaidOrders = async (req, res) => {
  try {
    const messId = req.user.mess_id;
    const { rows: orders } = await query(`
      SELECT o.*, u.name as student_name
      FROM orders o
      JOIN users u ON u.id = o.user_id
      WHERE o.mess_id = $1 AND o.payment_method = 'Pay on Site'
      ORDER BY o.created_at DESC
    `, [messId]);

    const result = await Promise.all(orders.map(async order => {
      const { rows: items } = await query('SELECT * FROM order_items WHERE order_id = $1', [order.id]);
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
    }));

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
exports.collectPostpaidPayment = async (req, res) => {
  try {
    const orderId = req.params.id;
    const messId = req.user.mess_id;

    const { rows: orderRows } = await query(
      "SELECT * FROM orders WHERE id = $1 AND mess_id = $2 AND payment_method = 'Pay on Site'",
      [orderId, messId]
    );
    const order = orderRows[0];

    if (!order) {
      return res.status(404).json({ error: 'Postpaid order not found.' });
    }
    if (order.payment_collected) {
      return res.status(400).json({ error: 'Payment already collected.' });
    }

    const client = await getClient();
    try {
      await client.query('BEGIN');

      // Mark order as collected
      await client.query(
        "UPDATE orders SET payment_collected = 1, updated_at = NOW() WHERE id = $1",
        [orderId]
      );

      // Insert payment record
      await client.query(`
        INSERT INTO payments (order_id, user_id, mess_id, amount, type, status, remarks, created_at)
        VALUES ($1, $2, $3, $4, 'order', 'captured', 'Postpaid - Cash Collected', NOW())
      `, [orderId, order.user_id, messId, order.total]);

      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }

    res.json({ success: true, message: `₹${order.total} collected for order #${orderId}` });
  } catch (err) {
    console.error('collectPostpaidPayment error:', err);
    res.status(500).json({ error: 'Failed to collect payment.' });
  }
};

// ============================================================
// OWNER PROFILE SETTINGS
// ============================================================

/**
 * PUT /api/admin/profile/name
 */
exports.updateOwnerName = async (req, res) => {
  const { name } = req.body;
  if (!name || name.trim().length < 2) {
    return res.status(400).json({ message: 'Name must be at least 2 characters.' });
  }
  try {
    await query('UPDATE users SET name = $1 WHERE id = $2', [name.trim(), req.user.id]);
    res.json({ message: 'Name updated successfully.' });
  } catch (e) {
    res.status(500).json({ message: 'Failed to update name.' });
  }
};

/**
 * PUT /api/admin/profile/password
 */
exports.resetOwnerPassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Both fields are required.' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'New password must be at least 6 characters.' });
  }
  try {
    const { rows } = await query('SELECT password FROM users WHERE id = $1', [req.user.id]);
    const valid = await bcrypt.compare(currentPassword, rows[0].password);
    if (!valid) return res.status(401).json({ message: 'Current password is incorrect.' });
    const hashed = await bcrypt.hash(newPassword, 10);
    await query('UPDATE users SET password = $1 WHERE id = $2', [hashed, req.user.id]);
    res.json({ message: 'Password updated successfully.' });
  } catch (e) {
    res.status(500).json({ message: 'Failed to update password.' });
  }
};

/**
 * PUT /api/admin/mess/details
 */
exports.updateMessDetails = async (req, res) => {
  const { messName, location, contact, hoursBreakfast, hoursLunch, hoursDinner, todaysSpecial } = req.body;
  if (!messName || messName.trim().length < 2) {
    return res.status(400).json({ message: 'Mess name must be at least 2 characters.' });
  }
  try {
    const messId = req.user.mess_id;
    await query(
      `UPDATE messes SET
        name = $1,
        location = $2,
        contact = $3,
        hours_breakfast = $4,
        hours_lunch = $5,
        hours_dinner = $6,
        todays_special = $7
       WHERE id = $8`,
      [
        messName.trim(),
        location || null,
        contact || null,
        hoursBreakfast || null,
        hoursLunch || null,
        hoursDinner || null,
        todaysSpecial || null,
        messId
      ]
    );
    res.json({ message: 'Mess details updated successfully.' });
  } catch (e) {
    res.status(500).json({ message: 'Failed to update mess details.' });
  }
};
