const jwt = require('jsonwebtoken');

/**
 * JWT Authentication Middleware
 * Extracts token from Authorization header, verifies it,
 * and attaches decoded user to req.user
 */
const auth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user payload to request
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      mess_id: decoded.mess_id || null
    };

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired. Please login again.' });
    }
    return res.status(401).json({ error: 'Invalid token.' });
  }
};

module.exports = auth;
