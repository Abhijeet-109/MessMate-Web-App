const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const adminController = require('../controllers/admin.controller');

// All admin routes require auth + admin role
router.use(auth);
router.use(roleCheck('admin'));

// Dashboard
router.get('/dashboard', adminController.getDashboard);

// Orders
router.get('/orders', adminController.getOrders);
router.get('/orders/postpaid', adminController.getPostpaidOrders);
router.put('/orders/:id/status', adminController.updateOrderStatus);
router.post('/orders/:id/collect-payment', adminController.collectPostpaidPayment);

// Menu CRUD
router.get('/menu', adminController.getMenu);
router.post('/menu', adminController.addMenuItem);
router.put('/menu/:id', adminController.updateMenuItem);
router.delete('/menu/:id', adminController.deleteMenuItem);

// Slots CRUD
router.get('/slots', adminController.getSlots);
router.post('/slots', adminController.addSlot);
router.put('/slots/:id', adminController.updateSlot);
router.delete('/slots/:id', adminController.deleteSlot);

// Subscribers
router.get('/subscribers', adminController.getSubscribers);
router.put('/subscribers/:id', adminController.updateSubscriber);

// Billing
router.get('/billing', adminController.getBilling);
router.get('/billing/export', adminController.exportBillingCSV);

// Reviews
router.get('/reviews', adminController.getReviews);

// Attendance
router.put('/attendance/:orderId', adminController.markAttendance);

// Students
router.get('/students', adminController.getStudents);
router.get('/students/:id', adminController.getStudentProfile);
router.put('/students/:id/status', adminController.toggleStudentStatus);

// Mess profile
router.get('/mess', adminController.getMess);
router.put('/mess', adminController.updateMess);

// Menu toggle availability
router.patch('/menu/:id/toggle', adminController.toggleMenuAvailability);

// Plans (full CRUD)
router.get('/plans', adminController.getPlans);
router.post('/plans', adminController.addPlan);
router.put('/plans/:id', adminController.updatePlan);
router.delete('/plans/:id', adminController.deletePlan);

module.exports = router;
