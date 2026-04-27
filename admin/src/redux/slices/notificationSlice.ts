import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { Notification } from '../../types'

interface NotificationState {
  items: Notification[]
  unreadCount: number
}

const initialState: NotificationState = {
  items: [
    {
      id: '1',
      type: 'order',
      title: 'New Order Received',
      message: 'Order #HC1234 placed by Rahul Sharma',
      isRead: false,
      createdAt: new Date(Date.now() - 60000).toISOString(),
    },
    {
      id: '2',
      type: 'stock',
      title: 'Low Stock Alert',
      message: 'Madhubani Painting has only 2 items left',
      isRead: false,
      createdAt: new Date(Date.now() - 300000).toISOString(),
    },
    {
      id: '3',
      type: 'payment',
      title: 'Payment Successful',
      message: 'Order #HC1230 payment of ₹2,450 received',
      isRead: true,
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
  ],
  unreadCount: 2,
}

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification: (state, action: PayloadAction<Notification>) => {
      state.items.unshift(action.payload)
      state.unreadCount += 1
    },
    markAsRead: (state, action: PayloadAction<string>) => {
      const n = state.items.find(i => i.id === action.payload)
      if (n && !n.isRead) {
        n.isRead = true
        state.unreadCount = Math.max(0, state.unreadCount - 1)
      }
    },
    markAllAsRead: (state) => {
      state.items.forEach(n => { n.isRead = true })
      state.unreadCount = 0
    },
    clearNotification: (state, action: PayloadAction<string>) => {
      const wasUnread = state.items.find(i => i.id === action.payload && !i.isRead)
      state.items = state.items.filter(i => i.id !== action.payload)
      if (wasUnread) state.unreadCount = Math.max(0, state.unreadCount - 1)
    },
  },
})

export const { addNotification, markAsRead, markAllAsRead, clearNotification } = notificationSlice.actions
export default notificationSlice.reducer
