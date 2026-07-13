const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

// POST /api/auth/register — Register new student
router.post('/register', authController.register);

// POST /api/auth/register-owner — Register new mess owner + create mess
router.post('/register-owner', authController.registerOwner);

// POST /api/auth/login — Login (student or admin)
router.post('/login', authController.login);

const auth = require('../middleware/auth');
router.post('/refresh', auth, authController.refreshToken);

module.exports = router;
