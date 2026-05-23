import axios from 'axios';

// ─── Axios instance pointing at our Express backend ──────────────────────────
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
});

// ─── Request interceptor — attach JWT token automatically ────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('messmate_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Response interceptor — handle 401 globally ──────────────────────────────
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('messmate_token');
      localStorage.removeItem('messmate_user');
      window.location.href = '/student/login';
    }
    const message = error.response?.data?.error || error.message || 'An error occurred';
    return Promise.reject(new Error(message));
  }
);

// ─── Auth Service ─────────────────────────────────────────────────────────────
export const authService = {
  loginStudent: async (email, password) => {
    const data = await api.post('/auth/login', { email, password });
    localStorage.setItem('messmate_token', data.token);
    localStorage.setItem('messmate_user', JSON.stringify(data.user));
    return data;
  },

  loginAdmin: async (email, password) => {
    const data = await api.post('/auth/login', { email, password });
    localStorage.setItem('messmate_token', data.token);
    localStorage.setItem('messmate_user', JSON.stringify(data.user));
    return data;
  },

  register: async (name, email, password, phone, college) => {
    const data = await api.post('/auth/register', { name, email, password, phone, college });
    localStorage.setItem('messmate_token', data.token);
    localStorage.setItem('messmate_user', JSON.stringify(data.user));
    return data;
  },

  registerOwner: async ({ name, email, password, phone, messName, messLocation, messContact }) => {
    const data = await api.post('/auth/register-owner', { name, email, password, phone, messName, messLocation, messContact });
    localStorage.setItem('messmate_token', data.token);
    localStorage.setItem('messmate_user', JSON.stringify(data.user));
    return data;
  },

  logout: () => {
    localStorage.removeItem('messmate_token');
    localStorage.removeItem('messmate_user');
  },
};

// ─── Mess Service ─────────────────────────────────────────────────────────────
export const messService = {
  getAllMess: () => api.get('/mess'),

  getMessById: (id) => api.get(`/mess/${id}`),

  getMenuByType: (messId, mealType) => api.get(`/mess/${messId}/menu?type=${mealType}`),

  getSlots: (messId, mealType, date) => api.get(`/mess/${messId}/slots?meal_type=${mealType}&date=${date}`),

  getPlans: (messId) => api.get(`/mess/${messId}/plans`),
};

// ─── Order Service ────────────────────────────────────────────────────────────
export const orderService = {
  getStudentOrders: () => api.get('/student/orders'),

  getActiveOrders: () => api.get('/student/orders/active'),

  getOrderById: (id) => api.get(`/student/orders/${id}`),

  placeOrder: (orderData) => api.post('/student/orders', orderData),

  // Admin order management
  getAdminOrders: (status) => {
    const query = status && status !== 'all' ? `?status=${status}` : '';
    return api.get(`/admin/orders${query}`);
  },

  updateOrderStatus: (orderId, status) => api.put(`/admin/orders/${orderId}/status`, { status }),

  // Payment flow: create Razorpay order
  createPaymentOrder: (amount, orderId, type, messId) =>
    api.post('/payment/create-order', { amount, orderId, type, messId }),

  // Payment flow: verify after Razorpay checkout
  verifyPayment: (razorpay_order_id, razorpay_payment_id, razorpay_signature) =>
    api.post('/payment/verify', { razorpay_order_id, razorpay_payment_id, razorpay_signature }),
};

// ─── Student / User Service ───────────────────────────────────────────────────
export const userService = {
  getProfile: () => api.get('/student/profile'),

  updateProfile: (data) => api.put('/student/profile', data),

  getNotifications: () => api.get('/student/notifications'),

  markNotificationRead: (id) => api.put(`/student/notifications/${id}/read`),

  markAllNotificationsRead: () => api.put('/student/notifications/read-all'),

  clearReadNotifications: () => api.delete('/student/notifications/clear-read'),

  getSubscription: () => api.get('/student/subscription'),

  subscribe: (planId, messId) => api.post('/student/subscription/subscribe', { planId, messId }),

  getAttendance: (month) => api.get(`/student/attendance?month=${month}`),

  submitReview: (orderId, menuItemId, rating, comment) =>
    api.post('/student/reviews', { orderId, menuItemId, rating, comment }),
};

// ─── Admin Service ────────────────────────────────────────────────────────────
export const adminService = {
  getDashboard: (period) => api.get(`/admin/dashboard${period ? `?period=${period}` : ''}`),

  // Menu management
  getMenu: () => api.get('/admin/menu'),
  addMenuItem: (item) => api.post('/admin/menu', item),
  updateMenuItem: (id, item) => api.put(`/admin/menu/${id}`, item),
  deleteMenuItem: (id) => api.delete(`/admin/menu/${id}`),
  toggleMenuAvailability: (id) => api.patch(`/admin/menu/${id}/toggle`),

  // Slot management
  getSlots: () => api.get('/admin/slots'),
  updateSlot: (id, data) => api.put(`/admin/slots/${id}`, data),
  addSlot: (data) => api.post('/admin/slots', data),
  deleteSlot: (id) => api.delete(`/admin/slots/${id}`),

  // Subscriber management
  getSubscribers: (status) => {
    const query = status ? `?status=${status}` : '';
    return api.get(`/admin/subscribers${query}`);
  },
  updateSubscriber: (id, action, days) => api.put(`/admin/subscribers/${id}`, { action, days }),
  getStudents: () => api.get('/admin/students'),

  // Billing
  getBillingRecords: (type, status) => {
    const params = new URLSearchParams();
    if (type) params.append('type', type);
    if (status) params.append('status', status);
    const query = params.toString() ? `?${params}` : '';
    return api.get(`/admin/billing${query}`);
  },
  exportBillingCSV: () => `http://localhost:5000/api/admin/billing/export`,

  // Postpaid tracking
  getPostpaidOrders: () => api.get('/admin/orders/postpaid'),
  collectPostpaidPayment: (orderId) => api.post(`/admin/orders/${orderId}/collect-payment`),

  // Mess profile
  getMessProfile: () => api.get('/admin/mess'),
  updateMessProfile: (data) => api.put('/admin/mess', data),

  // Plan management
  getPlans: () => api.get('/admin/plans'),
  addPlan: (data) => api.post('/admin/plans', data),
  updatePlan: (id, data) => api.put(`/admin/plans/${id}`, data),
  deletePlan: (id) => api.delete(`/admin/plans/${id}`),

  // Reviews
  getReviews: () => api.get('/admin/reviews'),
};

export default api;
