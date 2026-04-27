import api from './api'
import type { Product, ProductFormData } from '../types'

export const productService = {
  getAll: (params?: { page?: number; limit?: number; search?: string; category?: string }) =>
    api.get('/products', { params: { ...params, limit: params?.limit || 20 } }),

  getById: (id: string) => api.get(`/products/${id}`),

  create: (data: ProductFormData) => api.post('/products', data),

  update: (id: string, data: Partial<ProductFormData>) => api.put(`/products/${id}`, data),

  delete: (id: string) => api.delete(`/products/${id}`),

  search: (query: string) => api.get(`/products/search?query=${encodeURIComponent(query)}`),

  filter: (filters: object) => api.post('/products/filter', filters),

  updateStock: (updates: Array<{ productId: string; quantity: number }>) =>
    api.post('/products/update-stock', { items: updates }),
}
