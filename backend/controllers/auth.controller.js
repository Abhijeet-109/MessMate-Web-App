const { query, getClient } = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/**
 * POST /api/auth/register
 * Register a new student account
 */
exports.register = async (req, res) => {
  try {
    const { name, email, password, phone, college } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    // Check if user already exists
    const { rows: existingRows } = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingRows[0]) {
      return res.status(409).json({ error: 'Email already registered.' });
    }

    // Hash password
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);

    // Insert user
    const { rows: insertRows } = await query(`
      INSERT INTO users (name, email, password, phone, college, role)
      VALUES ($1, $2, $3, $4, $5, 'student')
      RETURNING id
    `, [name, email, hashedPassword, phone || null, college || null]);
    const newId = insertRows[0].id;

    // Generate JWT
    const token = jwt.sign(
      { id: newId, email, role: 'student', mess_id: null },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return user data (matching frontend MOCK_USER shape)
    const { rows: userRows } = await query(
      'SELECT id, name, email, phone, college, role, mess_id, is_active FROM users WHERE id = $1',
      [newId]
    );
    const user = userRows[0];

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
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    // Find user
    const { rows: userRows } = await query('SELECT * FROM users WHERE email = $1', [email]);
    const user = userRows[0];
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
      const { rows: subRows } = await query(`
        SELECT s.*, m.name as mess_name
        FROM subscriptions s
        JOIN messes m ON m.id = s.mess_id
        WHERE s.user_id = $1 AND s.status = 'active'
        ORDER BY s.created_at DESC LIMIT 1
      `, [user.id]);
      const sub = subRows[0];

      if (sub) {
        const { rows: planRows } = await query('SELECT name FROM plans WHERE id = $1', [sub.plan_id]);
        userData.subscription = {
          isActive: true,
          planName: planRows[0]?.name,
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
exports.registerOwner = async (req, res) => {
  try {
    const { name, email, password, phone, messName, messLocation, messContact } = req.body;

    if (!name || !email || !password || !messName) {
      return res.status(400).json({ error: 'Name, email, password, and mess name are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    // Check if user already exists
    const { rows: existingRows } = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingRows[0]) {
      return res.status(409).json({ error: 'Email already registered.' });
    }

    // Hash password
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);

    // Generate unique mess ID
    const messId = `m${Date.now()}`;

    // Use a transaction to create both user and mess atomically
    const client = await getClient();
    let userId;
    try {
      await client.query('BEGIN');

      // Create user with admin role
      const userResult = await client.query(`
        INSERT INTO users (name, email, password, phone, role, mess_id)
        VALUES ($1, $2, $3, $4, 'admin', $5)
        RETURNING id
      `, [name, email, hashedPassword, phone || null, messId]);
      userId = userResult.rows[0].id;

      // Create mess record
      await client.query(`
        INSERT INTO messes (id, name, owner_id, location, contact, is_open)
        VALUES ($1, $2, $3, $4, $5, 1)
      `, [messId, messName, userId, messLocation || null, messContact || null]);

      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }

    // Generate JWT
    const token = jwt.sign(
      { id: userId, email, role: 'admin', mess_id: messId },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { rows: userRows } = await query(
      'SELECT id, name, email, phone, role, mess_id FROM users WHERE id = $1',
      [userId]
    );
    const user = userRows[0];

    res.status(201).json({
      token,
      user: { ...user, messId: messId }
    });
  } catch (err) {
    console.error('Register owner error:', err);
    res.status(500).json({ error: 'Owner registration failed.' });
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const { rows } = await query(
      'SELECT id, email, role, mess_id, is_active FROM users WHERE id = $1',
      [req.user.id]
    );
    const user = rows[0];
    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'Account not found or deactivated.' });
    }
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, mess_id: user.mess_id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: 'Token refresh failed.' });
  }
};
