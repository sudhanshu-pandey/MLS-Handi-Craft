import { createSlice } from '@reduxjs/toolkit'

interface UIState {
  sidebarCollapsed: boolean
  darkMode: boolean
  mobileSidebarOpen: boolean
}

const savedDark = localStorage.getItem('admin_dark_mode') === 'true'
if (savedDark) document.documentElement.classList.add('dark')

const initialState: UIState = {
  sidebarCollapsed: false,
  darkMode: savedDark,
  mobileSidebarOpen: false,
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => { state.sidebarCollapsed = !state.sidebarCollapsed },
    toggleDarkMode: (state) => {
      state.darkMode = !state.darkMode
      if (state.darkMode) {
        document.documentElement.classList.add('dark')
        localStorage.setItem('admin_dark_mode', 'true')
      } else {
        document.documentElement.classList.remove('dark')
        localStorage.setItem('admin_dark_mode', 'false')
      }
    },
    setMobileSidebar: (state, action) => { state.mobileSidebarOpen = action.payload },
    setSidebarCollapsed: (state, action) => { state.sidebarCollapsed = action.payload },
  },
})

export const { toggleSidebar, toggleDarkMode, setMobileSidebar, setSidebarCollapsed } = uiSlice.actions
export default uiSlice.reducer
