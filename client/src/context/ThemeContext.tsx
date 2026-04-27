import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react'
import { getUserState } from '../utils/geolocation'
import { getColorForState, type ThemeColorKey } from '../utils/stateColorMap'

type ThemeMode = 'light' | 'dark'

type ThemeColor = {
  key: ThemeColorKey
  label: string
  value: string
  dark: string
}

type ThemeContextValue = {
  themeMode: ThemeMode
  activeColor: ThemeColorKey
  colors: ThemeColor[]
  setThemeMode: (mode: ThemeMode) => void
  setActiveColor: (color: ThemeColorKey) => void
  toggleThemeMode: () => void
}

const STORAGE_COLOR_KEY = 'mls_theme_color'
const STORAGE_MODE_KEY = 'mls_theme_mode'

const themeColors: ThemeColor[] = [
  { key: 'brown', label: 'Default Brown', value: '#6B3418', dark: '#4A2412' },
  { key: 'terracotta', label: 'Terracotta', value: '#A0522D', dark: '#7B3D22' },
  { key: 'olive', label: 'Olive', value: '#8A8F3A', dark: '#666A2B' },
  { key: 'blue', label: 'Blue', value: '#2F80ED', dark: '#1D5FB6' },
  { key: 'green', label: 'Green', value: '#6AA84F', dark: '#4E7F3A' },
  { key: 'purple', label: 'Purple', value: '#6C4AB6', dark: '#4F3590' },
  { key: 'orange', label: 'Orange', value: '#D98C2B', dark: '#A5681F' },
  { key: 'teal', label: 'Teal', value: '#1F8A8A', dark: '#156565' },
  { key: 'crimson', label: 'Crimson', value: '#B23A48', dark: '#872C36' },
  { key: 'indigo', label: 'Indigo', value: '#4B5DCC', dark: '#38479C' },
  { key: 'cocoa', label: 'Cocoa', value: '#7A4B3A', dark: '#5C392D' },
  { key: 'mustard', label: 'Mustard', value: '#B68A2D', dark: '#8C6A22' },
  { key: 'wine', label: 'Wine', value: '#7D2E4F', dark: '#5D233B' },
]

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

const getColorByKey = (key: ThemeColorKey) => themeColors.find((item) => item.key === key) ?? themeColors[0]

const applyThemeColor = (key: ThemeColorKey) => {
  const selected = getColorByKey(key)
  document.documentElement.style.setProperty('--primary', selected.value)
  document.documentElement.style.setProperty('--primary-color', selected.value)
  document.documentElement.style.setProperty('--primary-dark', selected.dark)
}

const applyThemeMode = (mode: ThemeMode) => {
  document.documentElement.setAttribute('data-theme', mode)
}

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [activeColor, setActiveColorState] = useState<ThemeColorKey>('wine')
  const [themeMode, setThemeModeState] = useState<ThemeMode>('light')

  useEffect(() => {
    const initializeTheme = async () => {
      const savedColor = localStorage.getItem(STORAGE_COLOR_KEY) as ThemeColorKey | null
      const savedMode = localStorage.getItem(STORAGE_MODE_KEY) as ThemeMode | null

      // If user has saved color preference, use that
      if (savedColor && themeColors.some((item) => item.key === savedColor)) {
        const nextMode = savedMode === 'dark' ? 'dark' : 'light'
        setActiveColorState(savedColor)
        setThemeModeState(nextMode)
        applyThemeColor(savedColor)
        applyThemeMode(nextMode)
        return
      }

      // Otherwise, try to get location-based color
      try {
        const state = await getUserState()
        const locationColor = state ? getColorForState(state) : 'wine'
        
        const nextMode = savedMode === 'dark' ? 'dark' : 'light'
        setActiveColorState(locationColor)
        setThemeModeState(nextMode)
        applyThemeColor(locationColor)
        applyThemeMode(nextMode)
        
        // Save the auto-detected color so we don't fetch location again
        localStorage.setItem(STORAGE_COLOR_KEY, locationColor)
      } catch (error) {
        // If geolocation fails, use default color
        console.warn('Failed to get location for theme:', error)
        const nextMode = savedMode === 'dark' ? 'dark' : 'light'
        setActiveColorState('wine')
        setThemeModeState(nextMode)
        applyThemeColor('wine')
        applyThemeMode(nextMode)
      }
    }

    initializeTheme()
  }, [])

  const setActiveColor = (color: ThemeColorKey) => {
    setActiveColorState(color)
    applyThemeColor(color)
    localStorage.setItem(STORAGE_COLOR_KEY, color)
  }

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode)
    applyThemeMode(mode)
    localStorage.setItem(STORAGE_MODE_KEY, mode)
  }

  const toggleThemeMode = () => {
    const nextMode: ThemeMode = themeMode === 'light' ? 'dark' : 'light'
    setThemeMode(nextMode)
  }

  const value = useMemo(
    () => ({
      themeMode,
      activeColor,
      colors: themeColors,
      setThemeMode,
      setActiveColor,
      toggleThemeMode,
    }),
    [themeMode, activeColor],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}
