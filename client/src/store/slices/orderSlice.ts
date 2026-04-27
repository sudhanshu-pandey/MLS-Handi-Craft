import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/api'

export interface OrderItem {
  product?: {
    _id: string
    name: string
    price: number
  }
  quantity: number
  price: number
}

export interface Order {
  _id: string
  items: OrderItem[]
  total: number
  status: string
  createdAt: string
  updatedAt?: string
}

interface OrderState {
  orders: Order[]
  loading: boolean
  error: string | null
}

// Async thunk to fetch orders from API
export const fetchOrders = createAsyncThunk(
  'orders/fetchOrders',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.request('/orders')
      return response.orders || []
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch orders')
    }
  }
)

const initialState: OrderState = {
  orders: [],
  loading: false,
  error: null,
}

const orderSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrders.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.loading = false
        state.orders = action.payload
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
  },
})

export default orderSlice.reducer
