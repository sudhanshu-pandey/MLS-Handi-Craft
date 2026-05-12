import api from './api'

const announcementService = {
  getAll: () => api.get('/announcements'),
  create: (data: { text: string; active?: boolean }) => api.post('/announcements', data),
  update: (id: string, data: { text?: string; active?: boolean }) => api.put(`/announcements/${id}`, data),
  delete: (id: string) => api.delete(`/announcements/${id}`),
  getSettings: () => api.get('/announcements/settings'),
  updateSettings: (data: { separator?: string; speed?: number; spacing?: number }) => api.put('/announcements/settings/update', data),
}

export default announcementService
