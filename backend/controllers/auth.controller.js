const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/**
 * POST /api/auth/register
 * Register a new student account
 */
exports.register = (req, res) => {
  try {
    const { name, email, password, phone, college } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    // Check if user already exists
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return res.status(409).json({ error: 'Email already registered.' });
    }

    // Hash password
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);

    // Insert user
    const result = db.prepare(`
      INSERT INTO users (name, email, password, phone, college, role)
      VALUES (?, ?, ?, ?, ?, 'student')
    `).run(name, email, hashedPassword, phone || null, college || null);

    // Generate JWT
    const token = jwt.sign(
      { id: result.lastInsertRowid, email, role: 'student', mess_id: null },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return user data (matching frontend MOCK_USER shape)
    const user = db.prepare('SELECT id, name, email, phone, college, role, mess_id, is_active FROM users WHERE id = ?')
      .get(result.lastInsertRowid);

    res.status(201).json({ token, user });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed.' });
  }
};

/**
 * POST /api/auth/login
 * Login for both student and admin (role determined from DB)
 */
exports.login = (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    // Find user
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    if (!user.is_active) {
      return res.status(403).json({ error: 'Account deactivated. Contact support.' });
    }

    // Verify password
    const isValid = bcrypt.compareSync(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, mess_id: user.mess_id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Build response user object (strip password)
    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      college: user.college,
      role: user.role,
      mess_id: user.mess_id
    };

    // If student, attach subscription info
    if (user.role === 'student') {
      const sub = db.prepare(`
        SELECT s.*, m.name as mess_name
        FROM subscriptions s
        JOIN messes m ON m.id = s.mess_id
        WHERE s.user_id = ? AND s.status = 'active'
        ORDER BY s.created_at DESC LIMIT 1
      `).get(user.id);

      if (sub) {
        userData.subscription = {
          isActive: true,
          planName: db.prepare('SELECT name FROM plans WHERE id = ?').get(sub.plan_id)?.name,
          messId: sub.mess_id,
          messName: sub.mess_name,
          mealsRemaining: sub.meals_remaining,
          totalMeals: sub.total_meals,
          expiresAt: sub.expires_at,
          noShowCount: sub.no_show_count,
          maxNoShows: sub.max_no_shows
        };
      } else {
        userData.subscription = { isActive: false };
      }
    }

    // If admin, attach messId
    if (user.role === 'admin') {
      userData.messId = user.mess_id;
    }

    res.json({ token, user: userData });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed.' });
  }
};

/**
 * POST /api/auth/register-owner
 * Register a new mess owner account + create a mess
 */
exports.registerOwner = (req, res) => {
  try {
    const { name, email, password, phone, messName, messLocation, messContact } = req.body;

    if (!name || !email || !password || !messName) {
      return res.status(400).json({ error: 'Name, email, password, and mess name are required.' });
    }

    // Check if user already exists
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return res.status(409).json({ error: 'Email already registered.' });
    }

    // Hash password
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);

    // Generate unique mess ID
    const messId = `m${Date.now()}`;

    // Use a transaction to create both user and mess atomically
    const createOwner = db.transaction(() => {
      // Create user with admin role
      const userResult = db.prepare(`
        INSERT INTO users (name, email, password, phone, role, mess_id)
        VALUES (?, ?, ?, ?, 'admin', ?)
      `).run(name, email, hashedPassword, phone || null, messId);

      // Create mess record
      db.prepare(`
        INSERT INTO messes (id, name, owner_id, location, contact, is_open)
        VALUES (?, ?, ?, ?, ?, 1)
      `).run(messId, messName, userResult.lastInsertRowid, messLocation || null, messContact || null);

      return userResult.lastInsertRowid;
    });

    const userId = createOwner();

    // Generate JWT
    const token = jwt.sign(
      { id: userId, email, role: 'admin', mess_id: messId },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const user = db.prepare('SELECT id, name, email, phone, role, mess_id FROM users WHERE id = ?').get(userId);

    res.status(201).json({
      token,
      user: { ...user, messId: messId }
    });
  } catch (err) {
    console.error('Register owner error:', err);
    res.status(500).json({ error: 'Owner registration failed.' });
  }
};
