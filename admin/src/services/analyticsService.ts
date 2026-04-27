import api from './api'

export const analyticsService = {
  getKPIs: (startDate?: string, endDate?: string) =>
    api.get('/analytics/kpis', { params: { startDate, endDate } }),

  getRevenueTrend: (period: 'daily' | 'weekly' | 'monthly' = 'daily', days = 30) =>
    api.get('/analytics/revenue', { params: { period, days } }),

  getCategoryRevenue: (startDate?: string, endDate?: string) =>
    api.get('/analytics/category-revenue', { params: { startDate, endDate } }),

  getOrderStats: (limit = 500) => api.get('/orders/admin/all', { params: { limit } }),
  getProductStats: () => api.get('/products', { params: { limit: 500 } }),
  getUserStats: (limit = 500) => api.get('/user/admin/all', { params: { limit } }),
}
