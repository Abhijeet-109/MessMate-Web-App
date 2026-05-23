/**
 * Global Error Handler Middleware
 * Catches all unhandled errors and returns a clean JSON response
 */
const errorHandler = (err, req, res, next) => {
  console.error(`❌ [ERROR] ${err.message}`);
  if (process.env.NODE_ENV !== 'production') {
    console.error(err.stack);
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
};

module.exports = errorHandler;
