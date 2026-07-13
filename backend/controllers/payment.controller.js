const { query } = require('../config/db');
const { razorpay, verifyPaymentSignature, verifyWebhookSignature } = require('../utils/razorpay');

/**
 * POST /api/payment/create-order
 * Creates a Razorpay order for walk-in payment or subscription
 */
exports.createOrder = async (req, res) => {
  try {
    const { amount, orderId, type, messId } = req.body; // type: 'order' or 'subscription'

    if (!amount) {
      return res.status(400).json({ error: 'Amount is required.' });
    }

    const options = {
      amount: amount * 100, // Razorpay expects paise
      currency: 'INR',
      receipt: orderId || `rcpt_${Date.now()}`
    };

    const razorpayOrder = await razorpay.orders.create(options);

    // Store payment record
    await query(`
      INSERT INTO payments (order_id, user_id, mess_id, razorpay_order_id, amount, status, type)
      VALUES ($1, $2, $3, $4, $5, 'created', $6)
    `, [orderId || null, req.user.id, messId || null, razorpayOrder.id, amount, type || 'order']);

    res.json({
      razorpay_order_id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key_id: process.env.RAZORPAY_KEY_ID
    });
  } catch (err) {
    console.error('createOrder error:', err);
    res.status(500).json({ error: 'Failed to create payment order.' });
  }
};

/**
 * POST /api/payment/verify
 * Verifies Razorpay payment signature after frontend checkout
 */
exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: 'Missing payment verification fields.' });
    }

    const isValid = verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);

    if (!isValid) {
      // Mark payment as failed
      await query(
        "UPDATE payments SET status = 'failed' WHERE razorpay_order_id = $1",
        [razorpay_order_id]
      );
      return res.status(400).json({ error: 'Payment verification failed. Invalid signature.' });
    }

    // Mark payment as captured
    await query(`
      UPDATE payments SET
        status = 'captured',
        razorpay_payment_id = $1,
        razorpay_signature = $2
      WHERE razorpay_order_id = $3
    `, [razorpay_payment_id, razorpay_signature, razorpay_order_id]);

    // Get payment record to update associated order
    const { rows: paymentRows } = await query(
      'SELECT * FROM payments WHERE razorpay_order_id = $1',
      [razorpay_order_id]
    );
    const payment = paymentRows[0];

    if (payment && payment.order_id) {
      // Update order status to Placed (confirmed payment)
      await query(
        "UPDATE orders SET payment_id = $1, status = 'Placed', updated_at = NOW() WHERE id = $2",
        [razorpay_payment_id, payment.order_id]
      );
    }

    res.json({
      success: true,
      message: 'Payment verified successfully.',
      transactionId: razorpay_payment_id
    });
  } catch (err) {
    console.error('verifyPayment error:', err);
    res.status(500).json({ error: 'Payment verification failed.' });
  }
};

/**
 * POST /api/payment/webhook
 * Razorpay webhook handler (backup verification)
 * No auth middleware — uses webhook signature verification
 */
exports.webhook = async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const body = JSON.stringify(req.body);

    const isValid = verifyWebhookSignature(body, signature);

    if (!isValid) {
      return res.status(400).json({ error: 'Invalid webhook signature.' });
    }

    const event = req.body.event;
    const paymentEntity = req.body.payload?.payment?.entity;

    if (event === 'payment.captured' && paymentEntity) {
      const razorpayOrderId = paymentEntity.order_id;
      const razorpayPaymentId = paymentEntity.id;

      // Update payment record
      await query(
        "UPDATE payments SET status = 'captured', razorpay_payment_id = $1 WHERE razorpay_order_id = $2",
        [razorpayPaymentId, razorpayOrderId]
      );

      // Update associated order
      const { rows: paymentRows } = await query(
        'SELECT order_id FROM payments WHERE razorpay_order_id = $1',
        [razorpayOrderId]
      );
      const payment = paymentRows[0];
      if (payment?.order_id) {
        await query(
          "UPDATE orders SET payment_id = $1, status = 'Placed', updated_at = NOW() WHERE id = $2",
          [razorpayPaymentId, payment.order_id]
        );
      }
    }

    // Acknowledge webhook
    res.json({ status: 'ok' });
  } catch (err) {
    console.error('webhook error:', err);
    res.status(500).json({ error: 'Webhook processing failed.' });
  }
};
