import api from './api'

export const couponService = {
  getAll: () => api.get('/coupons?includeInactive=true'),
  create: (data: object) => api.post('/coupons/admin/create', data),
  update: (id: string, data: object) => api.put(`/coupons/admin/update/${id}`, data),
  delete: (id: string) => api.delete(`/coupons/admin/delete/${id}`),
}
