/**
 * Utility helpers for MessMate backend
 */

/**
 * Generate a unique order ID like MM-1234
 */
function generateOrderId() {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `MM-${num}`;
}

/**
 * Generate a unique transaction ID like TXN-12345
 */
function generateTxnId() {
  const num = Math.floor(10000 + Math.random() * 90000);
  return `TXN-${num}`;
}

/**
 * Get today's date as YYYY-MM-DD string
 */
function todayDate() {
  return new Date().toISOString().split('T')[0];
}

/**
 * Calculate days remaining between now and an expiry date
 */
function daysRemaining(expiresAt) {
  const now = new Date();
  const expiry = new Date(expiresAt);
  const diff = expiry - now;
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

/**
 * Format a date string to a readable format like "Jun 15, 2026"
 */
function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

module.exports = {
  generateOrderId,
  generateTxnId,
  todayDate,
  daysRemaining,
  formatDate
};
