const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const paymentController = require('../controllers/payment.controller');

// Create order + verify require auth
router.post('/create-order', auth, paymentController.createOrder);
router.post('/verify', auth, paymentController.verifyPayment);

// Webhook — NO auth (uses Razorpay signature verification)
router.post('/webhook', paymentController.webhook);

module.exports = router;
