/**
 * Global Error Handler Middleware
 * Catches all unhandled errors and returns a clean JSON response
 */
const errorHandler = (err, req, res, next) => {
  console.error(`❌ [ERROR] ${err.message}`);
  if (process.env.NODE_ENV !== 'production') {
    console.error(err.stack);
  }

  const status = err.statusCode || 500;
  const isProd = process.env.NODE_ENV === 'production';

  res.status(status).json({ error: isProd ? 'An internal error occurred.' : err.message });
};

module.exports = errorHandler;
