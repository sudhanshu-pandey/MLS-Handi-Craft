import api from './api'

export const bannerService = {
  getAll: () => api.get('/banners?includeInactive=true'),
  getById: (id: string) => api.get(`/banners/${id}`),
  create: (data: object) => api.post('/banners', data),
  update: (id: string, data: object) => api.put(`/banners/${id}`, data),
  delete: (id: string) => api.delete(`/banners/${id}`),
}
