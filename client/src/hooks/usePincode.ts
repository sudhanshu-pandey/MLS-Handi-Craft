import { useState, useCallback } from 'react'
import api from '../services/api'

interface DeliveryEstimate {
  minDays: number
  maxDays: number
  estimatedDelivery: string
  deliveryCharge: {
    amount: number
    status: string
  }
}

interface PincodeData {
  pincode: string
  city: string
  state: string
  region: string
  postOffices: Array<{
    name: string
    district: string
    state: string
    region: string
  }>
  deliveryEstimate: DeliveryEstimate
}

interface UsePincodeReturn {
  data: PincodeData | null
  loading: boolean
  error: string | null
  lookupPincode: (pincode: string) => Promise<void>
  clearError: () => void
  reset: () => void
}

/**
 * Custom hook for pincode lookup
 * Handles pincode validation, API calls, and delivery estimates
 */
const usePincode = (): UsePincodeReturn => {
  const [data, setData] = useState<PincodeData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const reset = useCallback(() => {
    setData(null)
    setError(null)
    setLoading(false)
  }, [])

  const lookupPincode = useCallback(async (pincode: string) => {
    // Reset previous error
    clearError()

    // Validate pincode
    if (!pincode || pincode.trim().length === 0) {
      setError('Please enter a pincode')
      return
    }

    if (!/^\d{6}$/.test(pincode.trim())) {
      setError('Please enter a valid 6-digit pincode')
      return
    }

    setLoading(true)

    try {
      const response = await api.lookupPincode(pincode.trim())

      if (response.success && response.data) {
        setData(response.data)
        setError(null)
      } else {
        setError(response.message || 'Pincode not found')
        setData(null)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to lookup pincode')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [clearError])

  return {
    data,
    loading,
    error,
    lookupPincode,
    clearError,
    reset,
  }
}

export default usePincode
export type { PincodeData, DeliveryEstimate, UsePincodeReturn }
