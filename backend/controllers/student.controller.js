const { query, getClient } = require('../config/db');
const { generateOrderId, todayDate, daysRemaining, formatDate } = require('../utils/helpers');
const bcrypt = require('bcryptjs');

/**
 * GET /api/student/profile
 */
exports.getProfile = async (req, res) => {
  try {
    const { rows: userRows } = await query(
      'SELECT id, name, email, phone, college, role, mess_id, is_active FROM users WHERE id = $1',
      [req.user.id]
    );
    const user = userRows[0];

    if (!user) return res.status(404).json({ error: 'User not found.' });

    // Attach subscription
    const { rows: subRows } = await query(`
      SELECT s.*, m.name as mess_name, p.name as plan_name
      FROM subscriptions s
      JOIN messes m ON m.id = s.mess_id
      JOIN plans p ON p.id = s.plan_id
      WHERE s.user_id = $1 AND s.status = 'active'
      ORDER BY s.created_at DESC LIMIT 1
    `, [user.id]);
    const sub = subRows[0];

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
exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, college } = req.body;

    await query(
      'UPDATE users SET name = COALESCE($1, name), phone = COALESCE($2, phone), college = COALESCE($3, college) WHERE id = $4',
      [name || null, phone || null, college || null, req.user.id]
    );

    const { rows } = await query(
      'SELECT id, name, email, phone, college, role FROM users WHERE id = $1',
      [req.user.id]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error('updateProfile error:', err);
    res.status(500).json({ error: 'Failed to update profile.' });
  }
};

/**
 * GET /api/student/orders
 */
exports.getOrders = async (req, res) => {
  try {
    const { rows: orders } = await query(`
      SELECT o.*, m.name as mess_name
      FROM orders o
      JOIN messes m ON m.id = o.mess_id
      WHERE o.user_id = $1
      ORDER BY o.created_at DESC
    `, [req.user.id]);

    const result = await Promise.all(orders.map(async order => {
      const { rows: items } = await query('SELECT * FROM order_items WHERE order_id = $1', [order.id]);
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
    }));

    res.json(result);
  } catch (err) {
    console.error('getOrders error:', err);
    res.status(500).json({ error: 'Failed to fetch orders.' });
  }
};

/**
 * GET /api/student/orders/active — Lightweight poll endpoint
 */
exports.getActiveOrders = async (req, res) => {
  try {
    const { rows: orders } = await query(`
      SELECT o.id, o.status, o.estimated_ready_time, o.updated_at,
             o.slot_time, o.meal_type, o.total, m.name as mess_name
      FROM orders o
      JOIN messes m ON m.id = o.mess_id
      WHERE o.user_id = $1 AND o.status NOT IN ('Completed', 'Cancelled', 'No-show')
      ORDER BY o.created_at DESC
    `, [req.user.id]);

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
exports.getOrderById = async (req, res) => {
  try {
    const { rows: orderRows } = await query(`
      SELECT o.*, m.name as mess_name
      FROM orders o
      JOIN messes m ON m.id = o.mess_id
      WHERE o.id = $1 AND o.user_id = $2
    `, [req.params.id, req.user.id]);
    const order = orderRows[0];

    if (!order) return res.status(404).json({ error: 'Order not found.' });

    const { rows: items } = await query('SELECT * FROM order_items WHERE order_id = $1', [order.id]);

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
exports.placeOrder = async (req, res) => {
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

    // Block postpaid ordering if no-show limit exceeded
    if (paymentMethod === 'Pay on Site') {
      const { rows: activeSubRows } = await query(
        "SELECT * FROM subscriptions WHERE user_id = $1 AND mess_id = $2 AND status = 'active'",
        [req.user.id, messId]
      );
      const activeSub = activeSubRows[0];
      if (activeSub && activeSub.no_show_count >= activeSub.max_no_shows) {
        return res.status(403).json({
          message: `Postpaid ordering blocked. You have missed ${activeSub.no_show_count} orders. Limit resets on subscription renewal.`
        });
      }
    }

    const orderId = generateOrderId();
    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Wrap entire DB logic in a transaction so partial writes don't persist on crash
    const client = await getClient();
    try {
      await client.query('BEGIN');

      let subscriptionId = null;

      // If paying via subscription, validate and deduct
      if (paymentMethod === 'Subscription') {
        const { rows: subRows } = await client.query(`
          SELECT * FROM subscriptions
          WHERE user_id = $1 AND mess_id = $2 AND status = 'active'
        `, [req.user.id, messId]);
        const sub = subRows[0];

        if (!sub) {
          throw new Error('No active subscription for this mess.');
        }
        if (sub.meals_remaining <= 0) {
          throw new Error('No meals remaining on your subscription.');
        }

        // Deduct one meal
        await client.query('UPDATE subscriptions SET meals_remaining = meals_remaining - 1 WHERE id = $1', [sub.id]);

        // Check if now expired
        if (sub.meals_remaining - 1 <= 0) {
          await client.query("UPDATE subscriptions SET status = 'expired' WHERE id = $1", [sub.id]);
        }

        subscriptionId = sub.id;
      }

      // Insert order
      await client.query(`
        INSERT INTO orders (id, user_id, mess_id, subscription_id, meal_type, slot_time, order_type, total, status, payment_method, payment_id, notes, estimated_ready_time)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Placed', $9, $10, $11, $12)
      `, [orderId, req.user.id, messId, subscriptionId, mealType, slotTime, orderType, total, paymentMethod, paymentId || null, notes || '', null]);

      // Insert order items
      for (const item of items) {
        await client.query(
          'INSERT INTO order_items (order_id, menu_item_id, name, quantity, price) VALUES ($1, $2, $3, $4, $5)',
          [orderId, item.id, item.name, item.quantity, item.price]
        );
      }

      // Increment slot bookings
      await client.query(
        'UPDATE slots SET booked = booked + 1 WHERE mess_id = $1 AND time = $2 AND meal_type = $3',
        [messId, slotTime, mealType.toLowerCase()]
      );

      // Link Razorpay payment record to this order (so it shows in billing)
      if (paymentId) {
        await client.query(
          "UPDATE payments SET order_id = $1, mess_id = $2 WHERE razorpay_payment_id = $3",
          [orderId, messId, paymentId]
        );
      }

      // Create notification (with explicit is_read = 0)
      const { rows: messRows } = await client.query('SELECT name FROM messes WHERE id = $1', [messId]);
      const messName = messRows[0]?.name;
      await client.query(
        "INSERT INTO notifications (user_id, type, message, is_read) VALUES ($1, 'success', $2, 0)",
        [req.user.id, `Your order #${orderId} has been placed at ${messName}`]
      );

      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }

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
exports.getSubscription = async (req, res) => {
  try {
    const { rows } = await query(`
      SELECT s.*, m.name as mess_name, p.name as plan_name
      FROM subscriptions s
      JOIN messes m ON m.id = s.mess_id
      JOIN plans p ON p.id = s.plan_id
      WHERE s.user_id = $1 AND s.status = 'active'
      ORDER BY s.created_at DESC LIMIT 1
    `, [req.user.id]);
    const sub = rows[0];

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
exports.subscribe = async (req, res) => {
  try {
    const { planId, messId } = req.body;

    if (!planId || !messId) {
      return res.status(400).json({ error: 'Plan ID and Mess ID are required.' });
    }

    const { paymentId } = req.body;
    if (!paymentId) {
      return res.status(400).json({ error: 'Payment required to activate subscription.' });
    }

    // Verify the payment exists and was captured
    const { rows: paymentRows } = await query(
      "SELECT * FROM payments WHERE razorpay_payment_id = $1 AND status = 'captured'",
      [paymentId]
    );
    if (!paymentRows[0]) {
      return res.status(400).json({ error: 'Valid payment not found. Complete payment before subscribing.' });
    }

    // Check if already has active sub
    const { rows: existingRows } = await query(
      "SELECT id FROM subscriptions WHERE user_id = $1 AND status = 'active'",
      [req.user.id]
    );
    if (existingRows[0]) {
      return res.status(400).json({ error: 'You already have an active subscription. Cancel it first.' });
    }

    const { rows: planRows } = await query('SELECT * FROM plans WHERE id = $1 AND mess_id = $2', [planId, messId]);
    const plan = planRows[0];
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found.' });
    }

    const startsAt = todayDate();
    const expiresDate = new Date();
    expiresDate.setDate(expiresDate.getDate() + 30);
    const expiresAt = expiresDate.toISOString().split('T')[0];

    const { rows: insertRows } = await query(`
      INSERT INTO subscriptions (user_id, mess_id, plan_id, meals_remaining, total_meals, status, starts_at, expires_at)
      VALUES ($1, $2, $3, $4, $5, 'active', $6, $7)
      RETURNING id
    `, [req.user.id, messId, planId, plan.total_meals, plan.total_meals, startsAt, expiresAt]);
    const subscriptionId = insertRows[0].id;

    await query(
      "UPDATE payments SET type = 'subscription' WHERE razorpay_payment_id = $1",
      [paymentId]
    );

    // Update user's mess_id
    await query('UPDATE users SET mess_id = $1 WHERE id = $2', [messId, req.user.id]);

    // Notification
    await query(
      "INSERT INTO notifications (user_id, type, message) VALUES ($1, 'success', $2)",
      [req.user.id, `You are now subscribed to ${plan.name}! Enjoy your meals.`]
    );

    res.status(201).json({
      success: true,
      subscriptionId,
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
exports.getAttendance = async (req, res) => {
  try {
    const month = req.query.month || todayDate().substring(0, 7); // YYYY-MM

    const { rows: records } = await query(`
      SELECT * FROM attendance
      WHERE user_id = $1 AND TO_CHAR(date, 'YYYY-MM') = $2
      ORDER BY date ASC
    `, [req.user.id, month]);

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
exports.getNotifications = async (req, res) => {
  try {
    const { rows: notifications } = await query(`
      SELECT * FROM notifications
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 20
    `, [req.user.id]);

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
exports.markNotificationRead = async (req, res) => {
  try {
    await query(
      'UPDATE notifications SET is_read = 1 WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('markNotificationRead error:', err);
    res.status(500).json({ error: 'Failed to update notification.' });
  }
};

/**
 * PUT /api/student/notifications/read-all
 */
exports.markAllNotificationsRead = async (req, res) => {
  try {
    await query('UPDATE notifications SET is_read = 1 WHERE user_id = $1', [req.user.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('markAllNotificationsRead error:', err);
    res.status(500).json({ error: 'Failed to mark all notifications read.' });
  }
};

/**
 * DELETE /api/student/notifications/clear-read
 */
exports.clearReadNotifications = async (req, res) => {
  try {
    await query('DELETE FROM notifications WHERE user_id = $1 AND is_read = 1', [req.user.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to clear notifications.' });
  }
};

/**
 * POST /api/student/reviews
 */
exports.submitReview = async (req, res) => {
  try {
    const { orderId, menuItemId, rating, comment } = req.body;

    if (!orderId || !menuItemId || !rating) {
      return res.status(400).json({ error: 'Order ID, menu item ID, and rating are required.' });
    }

    // Verify the order belongs to this user and is completed
    const { rows: orderRows } = await query(
      "SELECT * FROM orders WHERE id = $1 AND user_id = $2 AND status = 'Completed'",
      [orderId, req.user.id]
    );
    const order = orderRows[0];
    if (!order) {
      return res.status(400).json({ error: 'Can only review completed orders.' });
    }

    // Check for duplicate review
    const { rows: existingRows } = await query(
      'SELECT id FROM reviews WHERE user_id = $1 AND order_id = $2 AND menu_item_id = $3',
      [req.user.id, orderId, menuItemId]
    );
    if (existingRows[0]) {
      return res.status(409).json({ error: 'You have already reviewed this item for this order.' });
    }

    await query(`
      INSERT INTO reviews (user_id, order_id, menu_item_id, mess_id, rating, comment)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [req.user.id, orderId, menuItemId, order.mess_id, rating, comment || null]);

    // Update mess aggregate rating
    const { rows: statsRows } = await query(
      'SELECT AVG(rating) as avg_rating, COUNT(*) as count FROM reviews WHERE mess_id = $1',
      [order.mess_id]
    );
    const stats = statsRows[0];
    await query(
      'UPDATE messes SET rating = ROUND($1::numeric, 1), reviews_count = $2 WHERE id = $3',
      [stats.avg_rating, stats.count, order.mess_id]
    );

    res.status(201).json({ success: true, message: 'Review submitted.' });
  } catch (err) {
    console.error('submitReview error:', err);
    res.status(500).json({ error: 'Failed to submit review.' });
  }
};

// ============================================================
// SETTINGS (change name, reset password)
// ============================================================

/**
 * PUT /api/student/profile/name
 */
exports.updateName = async (req, res) => {
  const { name } = req.body;
  if (!name || name.trim().length < 2) {
    return res.status(400).json({ message: 'Name must be at least 2 characters.' });
  }
  try {
    await query(
      'UPDATE users SET name = $1 WHERE id = $2',
      [name.trim(), req.user.id]
    );
    res.json({ message: 'Name updated successfully.' });
  } catch (e) {
    res.status(500).json({ message: 'Failed to update name.' });
  }
};

/**
 * PUT /api/student/profile/password
 */
exports.resetPassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Both current and new password are required.' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'New password must be at least 6 characters.' });
  }
  try {
    const { rows } = await query('SELECT password FROM users WHERE id = $1', [req.user.id]);
    const user = rows[0];
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
      return res.status(401).json({ message: 'Current password is incorrect.' });
    }
    const hashed = await bcrypt.hash(newPassword, 10);
    await query('UPDATE users SET password = $1 WHERE id = $2', [hashed, req.user.id]);
    res.json({ message: 'Password updated successfully.' });
  } catch (e) {
    res.status(500).json({ message: 'Failed to update password.' });
  }
};

/**
 * GET /api/student/orders/by-date?date=YYYY-MM-DD
 */
exports.getOrdersByDate = async (req, res) => {
  const { date } = req.query;
  if (!date) return res.status(400).json({ error: 'date query param required. Format: YYYY-MM-DD' });
  try {
    const { rows: orders } = await query(`
      SELECT
        o.id, o.meal_type, o.slot_time, o.order_type,
        o.total, o.status, o.payment_method, o.created_at,
        m.name AS mess_name
      FROM orders o
      LEFT JOIN messes m ON o.mess_id = m.id
      WHERE o.user_id = $1 AND o.created_at::date = $2::date
      ORDER BY o.created_at ASC
    `, [req.user.id, date]);

    const result = await Promise.all(orders.map(async (order) => {
      const { rows: items } = await query(
        'SELECT name, quantity, price FROM order_items WHERE order_id = $1',
        [order.id]
      );
      return { ...order, items };
    }));

    res.json(result);
  } catch (e) {
    console.error('getOrdersByDate error:', e);
    res.status(500).json({ error: 'Failed to fetch orders by date.' });
  }
};

