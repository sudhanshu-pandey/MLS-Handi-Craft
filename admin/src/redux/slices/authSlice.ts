import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import type { AuthState, AdminUser } from '../../types'

// For demo: accept hardcoded admin credentials
// In production, this calls your backend auth endpoint
export const loginAdmin = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    try {
      // Try real API first
      const { default: api } = await import('../../services/api')
      const res = await api.post('/auth/admin/login', credentials)
      return res.data
    } catch {
      // Fallback: demo credentials
      if (credentials.email === 'admin@handicraft.com' && credentials.password === 'admin123') {
        const mockToken = 'demo_admin_token_' + Date.now()
        const mockUser: AdminUser = {
          _id: 'admin_001',
          name: 'Admin User',
          email: credentials.email,
          role: 'admin',
        }
        return { token: mockToken, user: mockUser }
      }
      if (credentials.email === 'manager@handicraft.com' && credentials.password === 'manager123') {
        const mockToken = 'demo_manager_token_' + Date.now()
        const mockUser: AdminUser = {
          _id: 'manager_001',
          name: 'Manager User',
          email: credentials.email,
          role: 'manager',
        }
        return { token: mockToken, user: mockUser }
      }
      return rejectWithValue('Invalid credentials')
    }
  }
)

const storedToken = localStorage.getItem('admin_token')
const storedUser = localStorage.getItem('admin_user')

const initialState: AuthState = {
  user: storedUser ? JSON.parse(storedUser) : null,
  token: storedToken,
  isAuthenticated: !!storedToken,
  isLoading: false,
  error: null,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null
      state.token = null
      state.isAuthenticated = false
      localStorage.removeItem('admin_token')
      localStorage.removeItem('admin_user')
    },
    clearError: (state) => { state.error = null },
    setCredentials: (state, action: PayloadAction<{ user: AdminUser; token: string }>) => {
      state.user = action.payload.user
      state.token = action.payload.token
      state.isAuthenticated = true
      localStorage.setItem('admin_token', action.payload.token)
      localStorage.setItem('admin_user', JSON.stringify(action.payload.user))
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginAdmin.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(loginAdmin.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload.user
        state.token = action.payload.token
        state.isAuthenticated = true
        localStorage.setItem('admin_token', action.payload.token)
        localStorage.setItem('admin_user', JSON.stringify(action.payload.user))
      })
      .addCase(loginAdmin.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
  },
})

export const { logout, clearError, setCredentials } = authSlice.actions
export default authSlice.reducer
