const express = require('express');
const cors = require('cors');
require('dotenv').config();

if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET is not set in environment. Exiting.');
  process.exit(1);
}

// Database
const { query, pool } = require('./config/db');
const seed = require('./config/seed');

// Middleware
const logger = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');

// Routes
const authRoutes = require('./routes/auth.routes');
const messRoutes = require('./routes/mess.routes');
const studentRoutes = require('./routes/student.routes');
const adminRoutes = require('./routes/admin.routes');
const paymentRoutes = require('./routes/payment.routes');

const app = express();
const PORT = process.env.PORT || 5000;

// --- Global Middleware ---
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json());

const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { error: 'Too many attempts. Please wait a moment and try again.' },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/auth', authLimiter);
app.use(logger);

// --- Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/mess', messRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payment', paymentRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// --- Error Handler (must be last) ---
app.use(errorHandler);

// --- Start Server ---
async function startServer() {
  try {
    await pool.query('SELECT 1');
    console.log('✅ Supabase connected');
  } catch (e) {
    console.error('FATAL: Cannot connect to database:', e.message);
    process.exit(1);
  }

  // Seeding disabled — data entered manually
  // const { rows } = await query('SELECT COUNT(*) as count FROM users');
  // if (parseInt(rows[0].count) === 0) { await seed(query); }

  app.listen(PORT, () => {
    console.log(`\n🚀 MessMate running on http://localhost:${PORT}`);
  });
}

startServer();
