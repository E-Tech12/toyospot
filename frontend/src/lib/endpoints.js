import { api } from './api'

// ---------------- Auth ----------------
export const authApi = {
  register: (payload) => api.post('/auth/register', payload, { auth: false }),
  resendOtp: (email) => api.post('/auth/resend-otp', { email }, { auth: false }),
  verifyOtp: (email, code) => api.post('/auth/verify-otp', { email, code }, { auth: false }),
  login: (email, password) => api.post('/auth/login', { email, password }, { auth: false }),
  logout: (refreshToken) => api.post('/auth/logout', { refresh_token: refreshToken }, { auth: false }),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }, { auth: false }),
  resetPassword: (email, code, newPassword) =>
    api.post('/auth/reset-password', { email, code, new_password: newPassword }, { auth: false }),
  me: () => api.get('/auth/me'),
  updateMe: (payload) => api.patch('/auth/me', payload)
}

// ---------------- Catalog ----------------
export const catalogApi = {
  listCategories: () => api.get('/categories'),
  listFoods: ({ category, search } = {}) => {
    const params = new URLSearchParams()
    if (category) params.set('category', category)
    if (search) params.set('search', search)
    const qs = params.toString()
    return api.get(`/foods${qs ? `?${qs}` : ''}`)
  },
  getFood: (slug) => api.get(`/foods/${slug}`),
  listFeatured: () => api.get('/foods/featured'),
  listPopular: () => api.get('/foods/popular')
}

// ---------------- Orders ----------------
export const orderApi = {
  checkout: (payload) => api.post('/orders', payload),
  listMine: () => api.get('/orders'),
  get: (orderId) => api.get(`/orders/${orderId}`),
  listMessages: (orderId) => api.get(`/orders/${orderId}/messages`),
  sendMessage: (orderId, text) => api.post(`/orders/${orderId}/messages`, { text })
}

// ---------------- Payments (Paystack) ----------------
export const paymentApi = {
  initialize: (orderId) => api.post(`/orders/${orderId}/pay/initialize`),
  verify: (orderId, reference) => api.post(`/orders/${orderId}/pay/verify`, { reference })
}

// ---------------- Addresses ----------------
export const addressApi = {
  list: () => api.get('/addresses'),
  create: (payload) => api.post('/addresses', payload),
  update: (id, payload) => api.patch(`/addresses/${id}`, payload),
  remove: (id) => api.del(`/addresses/${id}`)
}

// ---------------- Favorites ----------------
export const favoriteApi = {
  list: () => api.get('/favorites'),
  add: (foodId) => api.post(`/favorites/${foodId}`),
  remove: (foodId) => api.del(`/favorites/${foodId}`)
}

// ---------------- Notifications ----------------
export const notificationApi = {
  list: () => api.get('/notifications'),
  markRead: (id) => api.post(`/notifications/${id}/read`),
  markAllRead: () => api.post('/notifications/read-all')
}

// ---------------- Push ----------------
export const pushApi = {
  getVapidPublicKey: () => api.get('/push/vapid-public-key'),
  subscribe: (subscription) => api.post('/push/subscribe', subscription),
  unsubscribe: (subscription) => api.post('/push/unsubscribe', subscription)
}
