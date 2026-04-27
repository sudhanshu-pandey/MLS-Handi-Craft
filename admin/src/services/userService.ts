import api from './api'

export const userService = {
  getAll: (params?: { page?: number; limit?: number; search?: string }) =>
    api.get('/user/admin/all', { params }),

  getById: (userId: string) => api.get(`/user/admin/${userId}`),

  block: (userId: string) => api.put(`/user/admin/${userId}/block`),

  unblock: (userId: string) => api.put(`/user/admin/${userId}/unblock`),

  getOrderHistory: (userId: string) => api.get(`/orders/admin/user/${userId}`),
}
