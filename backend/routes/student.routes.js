const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const studentController = require('../controllers/student.controller');

// All student routes require auth + student role
router.use(auth);
router.use(roleCheck('student'));

// Profile
router.get('/profile', studentController.getProfile);
router.put('/profile', studentController.updateProfile);

// Orders
router.get('/orders', studentController.getOrders);
router.get('/orders/active', studentController.getActiveOrders);
router.get('/orders/:id', studentController.getOrderById);
router.post('/orders', studentController.placeOrder);

// Subscription
router.get('/subscription', studentController.getSubscription);
router.post('/subscription/subscribe', studentController.subscribe);

// Attendance
router.get('/attendance', studentController.getAttendance);

// Notifications
router.get('/notifications', studentController.getNotifications);
router.put('/notifications/read-all', studentController.markAllNotificationsRead);
router.delete('/notifications/clear-read', studentController.clearReadNotifications);
router.put('/notifications/:id/read', studentController.markNotificationRead);

// Reviews
router.post('/reviews', studentController.submitReview);

module.exports = router;
