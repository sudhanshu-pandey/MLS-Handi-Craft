import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react'
import api from '../services/api'
import { clearLocalCart } from '../utils/cartStorage'

export type Address = {
  id?: string
  label: string
  name: string
  phone: string
  line1: string
  line2?: string
  city: string
  state: string
  pincode: string
  landmark?: string
  isDefault?: boolean
}

export type UserProfile = {
  name: string
  email: string
  mobile: string
  gender: string
  dob: string
  addresses: Address[]
}

type AuthContextValue = {
  isLoggedIn: boolean
  userProfile: UserProfile | null
  login: (mobile: string) => void
  logout: () => void
  updateProfile: (profile: Partial<UserProfile>) => void
  sendOTP: (phone: string) => Promise<any>
  verifyOTP: (phone: string, otp: string) => Promise<any>
  isLoading: boolean
  error: string | null
}

const buildDefaultProfile = (mobile: string): UserProfile => ({
  name: 'User',
  email: '',
  mobile,
  gender: '',
  dob: '',
  addresses: [],
})

const AUTH_STORAGE_KEY = 'hc_auth_state'

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Restore auth state from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY)
      if (stored) {
        const { isLoggedIn: wasLoggedIn, profile } = JSON.parse(stored)
        if (wasLoggedIn && profile) {
          setIsLoggedIn(true)
          setUserProfile(profile)
          
          // Refresh profile from API in the background
          const refreshProfile = async () => {
            try {
              const profileResponse = await api.getUserProfile()
              const dbProfile = profileResponse.user
              
              const updatedProfile: UserProfile = {
                name: dbProfile.name || profile.name,
                email: dbProfile.email || profile.email,
                mobile: dbProfile.phone || profile.mobile,
                gender: dbProfile.gender || profile.gender,
                dob: dbProfile.dob || profile.dob,
                addresses: dbProfile.addresses || profile.addresses,
              }
              
              setUserProfile(updatedProfile)
              
              // Update localStorage with fresh profile
              localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
                isLoggedIn: true,
                profile: updatedProfile,
              }))
            } catch (err) {
              // Keep the stored profile if refresh fails
            }
          }
          
          refreshProfile()
        }
      }
    } catch (err) {
      // Error restoring auth state
    }
  }, [])

  // Listen for auth changes across tabs
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === AUTH_STORAGE_KEY) {
        try {
          if (event.newValue === null) {
            // Auth was cleared in another tab (logout)
            setIsLoggedIn(false)
            setUserProfile(null)
          } else {
            // Auth was set in another tab (login)
            const { isLoggedIn: newIsLoggedIn, profile } = JSON.parse(event.newValue)
            setIsLoggedIn(newIsLoggedIn)
            setUserProfile(profile)
          }
        } catch (err) {
          // Error syncing auth across tabs
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const sendOTP = useCallback(async (phone: string) => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Validate phone number format
      if (!phone || phone.length < 10) {
        const error = new Error('Invalid phone number format')
        setError(error.message)
        throw error
      }
      
      const result = await api.sendOTP(phone)
      return result
    } catch (err: any) {
      const message = err.message || 'Failed to send OTP'
      setError(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const verifyOTP = useCallback(async (phone: string, otp: string) => {
    try {
      setIsLoading(true)
      setError(null)
      const result = await api.verifyOTP(phone, otp)
      
      if (result.accessToken) {
        api.setToken(result.accessToken)
        
        // Fetch actual user profile from database
        try {
          const profileResponse = await api.getUserProfile()
          const dbProfile = profileResponse.user
          
          const profile: UserProfile = {
            name: dbProfile.name || 'User',
            email: dbProfile.email || '',
            mobile: dbProfile.phone || phone,
            gender: dbProfile.gender || '',
            dob: dbProfile.dob || '',
            addresses: dbProfile.addresses || [],
          }
          
          setUserProfile(profile)
          
          // Persist to localStorage
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
            isLoggedIn: true,
            profile,
          }))
        } catch (profileErr) {
          // If profile fetch fails, use default profile
          const profile = buildDefaultProfile(phone)
          setUserProfile(profile)
          
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
            isLoggedIn: true,
            profile,
          }))
        }
        
        setIsLoggedIn(true)
        
        // Dispatch cart sync event so Redux can sync cart to database
        window.dispatchEvent(new CustomEvent('userLoggedIn', { detail: { phone } }))
      }
      
      return result
    } catch (err: any) {
      const message = err.message || 'Failed to verify OTP'
      setError(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const login = useCallback((mobile: string) => {
    setIsLoading(true)
    const fetchAndSetProfile = async () => {
      try {
        // Try to fetch real profile from API
        const profileResponse = await api.getUserProfile()
        const dbProfile = profileResponse.user
        
        const profile: UserProfile = {
          name: dbProfile.name || 'User',
          email: dbProfile.email || '',
          mobile: dbProfile.phone || mobile,
          gender: dbProfile.gender || '',
          dob: dbProfile.dob || '',
          addresses: dbProfile.addresses || [],
        }
        
        setUserProfile(profile)
        setIsLoggedIn(true)
        
        // Persist to localStorage
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
          isLoggedIn: true,
          profile,
        }))
      } catch (err) {
        // If profile fetch fails, use default profile as fallback
        console.error('[AuthContext.login] Failed to fetch profile, using default:', err)
        const profile = buildDefaultProfile(mobile)
        setUserProfile(profile)
        setIsLoggedIn(true)
        
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
          isLoggedIn: true,
          profile,
        }))
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchAndSetProfile()
  }, [])

  const logout = useCallback(async () => {
    try {
      setIsLoading(true)
      // Clear token first to prevent any ongoing requests
      api.clearToken()
      // Clear guest cart on logout
      clearLocalCart()
      // Then notify server
      await api.logout()
    } catch (err) {
      // Logout error - still clear local state
    } finally {
      setIsLoggedIn(false)
      setUserProfile(null)
      setError(null)
      setIsLoading(false)
      // Remove auth from localStorage
      localStorage.removeItem(AUTH_STORAGE_KEY)
    }
  }, [])

  const updateProfile = useCallback((patch: Partial<UserProfile>) => {
    setUserProfile((prev) => (prev ? { ...prev, ...patch } : prev))
  }, [])

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        userProfile,
        login,
        logout,
        updateProfile,
        sendOTP,
        verifyOTP,
        isLoading,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
