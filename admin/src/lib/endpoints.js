import { api, apiFetch } from './api'

export const authApi = {
  login: (email, password) => api.post('/auth/login', { email, password }, { auth: false }),
  me: () => api.get('/auth/me'),
  logout: (refreshToken) => api.post('/auth/logout', { refresh_token: refreshToken }, { auth: false })
}

export const categoryApi = {
  list: () => api.get('/categories'),
  create: (name, slug, icon) =>
    apiFetch(`/admin/categories?${new URLSearchParams({ name, slug, icon: icon || '' })}`, { method: 'POST' }),
  remove: (id) => api.del(`/admin/categories/${id}`)
}

export const foodApi = {
  list: (includeArchived = false) => api.get(`/admin/foods${includeArchived ? '?include_archived=true' : ''}`),
  lowStock: () => api.get('/admin/foods/low-stock'),
  create: (payload) => api.post('/admin/foods', payload),
  update: (id, payload) => api.patch(`/admin/foods/${id}`, payload),
  restock: (id, quantityAvailable) => api.post(`/admin/foods/${id}/restock`, { quantity_available: quantityAvailable }),
  markSoldOut: (id) => api.post(`/admin/foods/${id}/mark-sold-out`),
  archive: (id) => api.post(`/admin/foods/${id}/archive`),
  unarchive: (id) => api.post(`/admin/foods/${id}/unarchive`),
  remove: (id) => api.del(`/admin/foods/${id}`),
  uploadImage: async (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return apiFetch('/admin/uploads/image', { method: 'POST', body: formData, isFormData: true })
  },
  uploadImageForFood: async (foodId, file) => {
    const formData = new FormData()
    formData.append('file', file)
    return apiFetch(`/admin/foods/${foodId}/image`, { method: 'POST', body: formData, isFormData: true })
  }
}

export const orderApi = {
  list: ({ status, customerId } = {}) => {
    const params = new URLSearchParams()
    if (status) params.set('status_filter', status)
    if (customerId) params.set('customer_id', customerId)
    const qs = params.toString()
    return api.get(`/admin/orders${qs ? `?${qs}` : ''}`)
  },
  get: (id) => api.get(`/admin/orders/${id}`),
  updateStatus: (id, status) => api.patch(`/admin/orders/${id}/status`, { status }),
  updatePaymentStatus: (id, paymentStatus) => api.patch(`/admin/orders/${id}/payment-status`, { payment_status: paymentStatus }),
  listMessages: (id) => api.get(`/admin/orders/${id}/messages`),
  sendMessage: (id, text) => api.post(`/admin/orders/${id}/messages`, { text })
}

export const customerApi = {
  list: () => api.get('/admin/customers'),
  get: (id) => api.get(`/admin/customers/${id}`)
}

export const analyticsApi = {
  overview: () => api.get('/admin/analytics/overview'),
  ordersPerDay: (days = 14) => api.get(`/admin/analytics/orders-per-day?days=${days}`),
  bestSellers: (limit = 10) => api.get(`/admin/analytics/best-sellers?limit=${limit}`),
  customerGrowth: (days = 30) => api.get(`/admin/analytics/customer-growth?days=${days}`),
  inventoryUsage: () => api.get('/admin/analytics/inventory-usage')
}

export const announcementApi = {
  list: () => api.get('/admin/announcements'),
  create: (title, body) => api.post('/admin/announcements', { title, body })
}
