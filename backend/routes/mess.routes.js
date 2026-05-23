const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const messController = require('../controllers/mess.controller');

// All mess routes require authentication (student logged in)
router.use(auth);

// GET /api/mess — List all messes
router.get('/', messController.getAllMess);

// GET /api/mess/:id — Get full mess detail
router.get('/:id', messController.getMessById);

// GET /api/mess/:id/menu — Get menu (optional ?meal_type=lunch)
router.get('/:id/menu', messController.getMenu);

// GET /api/mess/:id/slots — Get slots (optional ?meal_type=lunch)
router.get('/:id/slots', messController.getSlots);

// GET /api/mess/:id/plans — Get subscription plans
router.get('/:id/plans', messController.getPlans);

module.exports = router;
