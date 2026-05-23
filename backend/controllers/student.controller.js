const db = require('../config/db');
const { generateOrderId, todayDate, daysRemaining, formatDate } = require('../utils/helpers');

/**
 * GET /api/student/profile
 */
exports.getProfile = (req, res) => {
  try {
    const user = db.prepare('SELECT id, name, email, phone, college, role, mess_id, is_active FROM users WHERE id = ?')
      .get(req.user.id);

    if (!user) return res.status(404).json({ error: 'User not found.' });

    // Attach subscription
    const sub = db.prepare(`
      SELECT s.*, m.name as mess_name, p.name as plan_name
      FROM subscriptions s
      JOIN messes m ON m.id = s.mess_id
      JOIN plans p ON p.id = s.plan_id
      WHERE s.user_id = ? AND s.status = 'active'
      ORDER BY s.created_at DESC LIMIT 1
    `).get(user.id);

    if (sub) {
      user.subscription = {
        isActive: true,
        planName: sub.plan_name,
        messId: sub.mess_id,
        messName: sub.mess_name,
        mealsRemaining: sub.meals_remaining,
        totalMeals: sub.total_meals,
        expiresAt: formatDate(sub.expires_at),
        daysRemaining: daysRemaining(sub.expires_at),
        noShowCount: sub.no_show_count,
        maxNoShows: sub.max_no_shows
      };
    } else {
      user.subscription = { isActive: false };
    }

    res.json(user);
  } catch (err) {
    console.error('getProfile error:', err);
    res.status(500).json({ error: 'Failed to fetch profile.' });
  }
};

/**
 * PUT /api/student/profile
 */
exports.updateProfile = (req, res) => {
  try {
    const { name, phone, college } = req.body;

    db.prepare('UPDATE users SET name = COALESCE(?, name), phone = COALESCE(?, phone), college = COALESCE(?, college) WHERE id = ?')
      .run(name || null, phone || null, college || null, req.user.id);

    const user = db.prepare('SELECT id, name, email, phone, college, role FROM users WHERE id = ?').get(req.user.id);
    res.json(user);
  } catch (err) {
    console.error('updateProfile error:', err);
    res.status(500).json({ error: 'Failed to update profile.' });
  }
};

/**
 * GET /api/student/orders
 */
exports.getOrders = (req, res) => {
  try {
    const orders = db.prepare(`
      SELECT o.*, m.name as mess_name
      FROM orders o
      JOIN messes m ON m.id = o.mess_id
      WHERE o.user_id = ?
      ORDER BY o.created_at DESC
    `).all(req.user.id);

    const result = orders.map(order => {
      const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
      return {
        id: order.id,
        messId: order.mess_id,
        messName: order.mess_name,
        mealType: order.meal_type,
        slotTime: order.slot_time,
        orderType: order.order_type,
        items: items.map(i => ({ id: i.menu_item_id, name: i.name, quantity: i.quantity, price: i.price })),
        total: order.total,
        status: order.status,
        paymentMethod: order.payment_method,
        createdAt: order.created_at,
        estimatedReadyTime: order.estimated_ready_time,
        notes: order.notes
      };
    });

    res.json(result);
  } catch (err) {
    console.error('getOrders error:', err);
    res.status(500).json({ error: 'Failed to fetch orders.' });
  }
};

/**
 * GET /api/student/orders/active — Lightweight poll endpoint
 */
exports.getActiveOrders = (req, res) => {
  try {
    const orders = db.prepare(`
      SELECT o.id, o.status, o.estimated_ready_time, o.updated_at,
             o.slot_time, o.meal_type, o.total, m.name as mess_name
      FROM orders o
      JOIN messes m ON m.id = o.mess_id
      WHERE o.user_id = ? AND o.status NOT IN ('Completed', 'Cancelled', 'No-show')
      ORDER BY o.created_at DESC
    `).all(req.user.id);

    res.json(orders.map(o => ({
      id: o.id,
      status: o.status,
      messName: o.mess_name,
      mealType: o.meal_type,
      slotTime: o.slot_time,
      total: o.total,
      estimatedReadyTime: o.estimated_ready_time,
      updatedAt: o.updated_at
    })));
  } catch (err) {
    console.error('getActiveOrders error:', err);
    res.status(500).json({ error: 'Failed to fetch active orders.' });
  }
};

/**
 * GET /api/student/orders/:id
 */
exports.getOrderById = (req, res) => {
  try {
    const order = db.prepare(`
      SELECT o.*, m.name as mess_name
      FROM orders o
      JOIN messes m ON m.id = o.mess_id
      WHERE o.id = ? AND o.user_id = ?
    `).get(req.params.id, req.user.id);

    if (!order) return res.status(404).json({ error: 'Order not found.' });

    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);

    res.json({
      id: order.id,
      messId: order.mess_id,
      messName: order.mess_name,
      mealType: order.meal_type,
      slotTime: order.slot_time,
      orderType: order.order_type,
      items: items.map(i => ({ id: i.menu_item_id, name: i.name, quantity: i.quantity, price: i.price })),
      total: order.total,
      status: order.status,
      paymentMethod: order.payment_method,
      createdAt: order.created_at,
      estimatedReadyTime: order.estimated_ready_time,
      notes: order.notes
    });
  } catch (err) {
    console.error('getOrderById error:', err);
    res.status(500).json({ error: 'Failed to fetch order.' });
  }
};

/**
 * POST /api/student/orders — Place a new order
 */
exports.placeOrder = (req, res) => {
  try {
    const { messId, mealType, slotTime, orderType, items, paymentMethod, notes, paymentId } = req.body;

    if (!messId || !mealType || !slotTime || !orderType || !items || !paymentMethod) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }

    // Validate payment method
    const validPaymentMethods = ['Subscription', 'UPI', 'Card', 'Pay on Site'];
    if (!validPaymentMethods.includes(paymentMethod)) {
      return res.status(400).json({ error: `Invalid payment method. Must be one of: ${validPaymentMethods.join(', ')}` });
    }

    // For online payments (UPI/Card), require a verified paymentId from Razorpay
    if ((paymentMethod === 'UPI' || paymentMethod === 'Card') && !paymentId) {
      return res.status(400).json({ error: 'Online payment required. Please complete payment first.' });
    }

    const orderId = generateOrderId();
    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Wrap entire DB logic in a transaction so partial writes don't persist on crash
    const placeOrderTx = db.transaction(() => {
      let subscriptionId = null;

      // If paying via subscription, validate and deduct
      if (paymentMethod === 'Subscription') {
        const sub = db.prepare(`
          SELECT * FROM subscriptions
          WHERE user_id = ? AND mess_id = ? AND status = 'active'
        `).get(req.user.id, messId);

        if (!sub) {
          throw new Error('No active subscription for this mess.');
        }
        if (sub.meals_remaining <= 0) {
          throw new Error('No meals remaining on your subscription.');
        }

        // Deduct one meal
        db.prepare('UPDATE subscriptions SET meals_remaining = meals_remaining - 1 WHERE id = ?').run(sub.id);

        // Check if now expired
        if (sub.meals_remaining - 1 <= 0) {
          db.prepare("UPDATE subscriptions SET status = 'expired' WHERE id = ?").run(sub.id);
        }

        subscriptionId = sub.id;
      }

      // Insert order
      db.prepare(`
        INSERT INTO orders (id, user_id, mess_id, subscription_id, meal_type, slot_time, order_type, total, status, payment_method, payment_id, notes, estimated_ready_time)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Placed', ?, ?, ?, ?)
      `).run(orderId, req.user.id, messId, subscriptionId, mealType, slotTime, orderType, total, paymentMethod, paymentId || null, notes || '', null);

      // Insert order items
      const insertItem = db.prepare('INSERT INTO order_items (order_id, menu_item_id, name, quantity, price) VALUES (?, ?, ?, ?, ?)');
      items.forEach(item => {
        insertItem.run(orderId, item.id, item.name, item.quantity, item.price);
      });

      // Increment slot bookings
      db.prepare('UPDATE slots SET booked = booked + 1 WHERE mess_id = ? AND time = ? AND meal_type = ?')
        .run(messId, slotTime, mealType.toLowerCase());

      // Link Razorpay payment record to this order (so it shows in billing)
      if (paymentId) {
        db.prepare("UPDATE payments SET order_id = ?, mess_id = ? WHERE razorpay_payment_id = ?")
          .run(orderId, messId, paymentId);
      }

      // Create notification (with explicit is_read = 0)
      const messName = db.prepare('SELECT name FROM messes WHERE id = ?').get(messId)?.name;
      db.prepare("INSERT INTO notifications (user_id, type, message, is_read) VALUES (?, 'success', ?, 0)")
        .run(req.user.id, `Your order #${orderId} has been placed at ${messName}`);
    });

    placeOrderTx();

    res.status(201).json({ success: true, orderId });
  } catch (err) {
    console.error('placeOrder error:', err);
    // Return the specific error message for subscription validation errors
    if (err.message?.includes('subscription') || err.message?.includes('meals remaining')) {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: 'Failed to place order.' });
  }
};

/**
 * GET /api/student/subscription
 */
exports.getSubscription = (req, res) => {
  try {
    const sub = db.prepare(`
      SELECT s.*, m.name as mess_name, p.name as plan_name
      FROM subscriptions s
      JOIN messes m ON m.id = s.mess_id
      JOIN plans p ON p.id = s.plan_id
      WHERE s.user_id = ? AND s.status = 'active'
      ORDER BY s.created_at DESC LIMIT 1
    `).get(req.user.id);

    if (!sub) {
      return res.json({ isActive: false });
    }

    res.json({
      isActive: true,
      id: sub.id,
      planName: sub.plan_name,
      messId: sub.mess_id,
      messName: sub.mess_name,
      mealsRemaining: sub.meals_remaining,
      totalMeals: sub.total_meals,
      expiresAt: formatDate(sub.expires_at),
      daysRemaining: daysRemaining(sub.expires_at),
      noShowCount: sub.no_show_count,
      maxNoShows: sub.max_no_shows,
      startsAt: formatDate(sub.starts_at)
    });
  } catch (err) {
    console.error('getSubscription error:', err);
    res.status(500).json({ error: 'Failed to fetch subscription.' });
  }
};

/**
 * POST /api/student/subscription/subscribe
 */
exports.subscribe = (req, res) => {
  try {
    const { planId, messId } = req.body;

    if (!planId || !messId) {
      return res.status(400).json({ error: 'Plan ID and Mess ID are required.' });
    }

    // Check if already has active sub
    const existing = db.prepare("SELECT id FROM subscriptions WHERE user_id = ? AND status = 'active'").get(req.user.id);
    if (existing) {
      return res.status(400).json({ error: 'You already have an active subscription. Cancel it first.' });
    }

    const plan = db.prepare('SELECT * FROM plans WHERE id = ? AND mess_id = ?').get(planId, messId);
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found.' });
    }

    const startsAt = todayDate();
    const expiresDate = new Date();
    expiresDate.setDate(expiresDate.getDate() + 30);
    const expiresAt = expiresDate.toISOString().split('T')[0];

    const result = db.prepare(`
      INSERT INTO subscriptions (user_id, mess_id, plan_id, meals_remaining, total_meals, status, starts_at, expires_at)
      VALUES (?, ?, ?, ?, ?, 'active', ?, ?)
    `).run(req.user.id, messId, planId, plan.total_meals, plan.total_meals, startsAt, expiresAt);

    // Update user's mess_id
    db.prepare('UPDATE users SET mess_id = ? WHERE id = ?').run(messId, req.user.id);

    // Notification
    db.prepare("INSERT INTO notifications (user_id, type, message) VALUES (?, 'success', ?)")
      .run(req.user.id, `You are now subscribed to ${plan.name}! Enjoy your meals.`);

    res.status(201).json({
      success: true,
      subscriptionId: result.lastInsertRowid,
      message: 'Subscription activated successfully.'
    });
  } catch (err) {
    console.error('subscribe error:', err);
    res.status(500).json({ error: 'Failed to subscribe.' });
  }
};

/**
 * GET /api/student/attendance?month=2026-05
 */
exports.getAttendance = (req, res) => {
  try {
    const month = req.query.month || todayDate().substring(0, 7); // YYYY-MM

    const records = db.prepare(`
      SELECT * FROM attendance
      WHERE user_id = ? AND date LIKE ?
      ORDER BY date ASC
    `).all(req.user.id, `${month}%`);

    res.json(records.map(r => ({
      id: r.id,
      date: r.date,
      status: r.status,
      orderId: r.order_id
    })));
  } catch (err) {
    console.error('getAttendance error:', err);
    res.status(500).json({ error: 'Failed to fetch attendance.' });
  }
};

/**
 * GET /api/student/notifications
 */
exports.getNotifications = (req, res) => {
  try {
    const notifications = db.prepare(`
      SELECT * FROM notifications
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 20
    `).all(req.user.id);

    res.json(notifications.map(n => ({
      id: n.id,
      type: n.type,
      message: n.message,
      read: !!n.is_read,
      timestamp: n.created_at
    })));
  } catch (err) {
    console.error('getNotifications error:', err);
    res.status(500).json({ error: 'Failed to fetch notifications.' });
  }
};

/**
 * PUT /api/student/notifications/:id/read
 */
exports.markNotificationRead = (req, res) => {
  try {
    db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?')
      .run(req.params.id, req.user.id);
    res.json({ success: true });
  } catch (err) {
    console.error('markNotificationRead error:', err);
    res.status(500).json({ error: 'Failed to update notification.' });
  }
};

/**
 * PUT /api/student/notifications/read-all
 */
exports.markAllNotificationsRead = (req, res) => {
  try {
    db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(req.user.id);
    res.json({ success: true });
  } catch (err) {
    console.error('markAllNotificationsRead error:', err);
    res.status(500).json({ error: 'Failed to mark all notifications read.' });
  }
};

/**
 * DELETE /api/student/notifications/clear-read
 */
exports.clearReadNotifications = (req, res) => {
  try {
    db.prepare('DELETE FROM notifications WHERE user_id = ? AND is_read = 1').run(req.user.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to clear notifications.' });
  }
};

/**
 * POST /api/student/reviews
 */
exports.submitReview = (req, res) => {
  try {
    const { orderId, menuItemId, rating, comment } = req.body;

    if (!orderId || !menuItemId || !rating) {
      return res.status(400).json({ error: 'Order ID, menu item ID, and rating are required.' });
    }

    // Verify the order belongs to this user and is completed
    const order = db.prepare("SELECT * FROM orders WHERE id = ? AND user_id = ? AND status = 'Completed'")
      .get(orderId, req.user.id);
    if (!order) {
      return res.status(400).json({ error: 'Can only review completed orders.' });
    }

    // Check for duplicate review
    const existing = db.prepare('SELECT id FROM reviews WHERE user_id = ? AND order_id = ? AND menu_item_id = ?')
      .get(req.user.id, orderId, menuItemId);
    if (existing) {
      return res.status(409).json({ error: 'You have already reviewed this item for this order.' });
    }

    db.prepare(`
      INSERT INTO reviews (user_id, order_id, menu_item_id, mess_id, rating, comment)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(req.user.id, orderId, menuItemId, order.mess_id, rating, comment || null);

    // Update mess aggregate rating
    const stats = db.prepare('SELECT AVG(rating) as avg_rating, COUNT(*) as count FROM reviews WHERE mess_id = ?')
      .get(order.mess_id);
    db.prepare('UPDATE messes SET rating = ROUND(?, 1), reviews_count = ? WHERE id = ?')
      .run(stats.avg_rating, stats.count, order.mess_id);

    res.status(201).json({ success: true, message: 'Review submitted.' });
  } catch (err) {
    console.error('submitReview error:', err);
    res.status(500).json({ error: 'Failed to submit review.' });
  }
};
