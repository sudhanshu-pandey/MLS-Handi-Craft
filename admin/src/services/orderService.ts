import api from './api'
import type { OrderStatus } from '../types'

export const orderService = {
  getAll: (params?: {
    page?: number
    limit?: number
    status?: string
    startDate?: string
    endDate?: string
    search?: string
  }) => api.get('/orders/admin/all', { params }),

  getById: (orderId: string) => api.get(`/orders/${orderId}`),

  updateStatus: (orderId: string, status: OrderStatus) =>
    api.put(`/orders/${orderId}/status`, { status }),

  cancelWithRefund: (orderId: string, reason: string) =>
    api.post(`/orders/${orderId}/cancel-with-refund`, { reason }),
}
