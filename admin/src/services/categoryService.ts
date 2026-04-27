import api from './api'

export const categoryService = {
  getAll: () => api.get('/categories?includeInactive=true'),
  getBySlug: (slug: string) => api.get(`/categories/slug/${slug}`),
  create: (data: { name: string; description?: string; image?: string; slug: string }) =>
    api.post('/categories', data),
  update: (id: string, data: object) => api.put(`/categories/${id}`, data),
  delete: (id: string) => api.delete(`/categories/${id}`),
}
