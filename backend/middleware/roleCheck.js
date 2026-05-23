/**
 * Role-based Access Control Middleware (factory function)
 * Usage: roleCheck('admin') or roleCheck('student')
 */
const roleCheck = (requiredRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    if (req.user.role !== requiredRole) {
      return res.status(403).json({ error: `Access denied. ${requiredRole} role required.` });
    }

    next();
  };
};

module.exports = roleCheck;
