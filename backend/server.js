const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Database init (creates tables + seeds on first run)
const db = require('./config/db');

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
app.use(cors());
app.use(express.json());
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
app.listen(PORT, () => {
  console.log(`\n🚀 MessMate Backend running on http://localhost:${PORT}`);
  console.log(`📦 Database: SQLite (data/messmate.db)\n`);
});
