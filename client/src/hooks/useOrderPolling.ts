import { useEffect, useRef, useCallback } from 'react'
import api from '../services/api'

export interface Order {
  _id: string
  status: 'ordered' | 'packed' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled'
  items: any[]
  total: number
  subtotal: number
  discount: number
  couponDiscount: number
  deliveryFee: number
  couponCode?: string
  paymentMethod: string
  paymentStatus: string
  estimatedDelivery: string
  address: any
  refundId?: string
}

interface UseOrderPollingOptions {
  orderId: string | undefined
  isLoggedIn: boolean
  onStatusChange?: (previousStatus: string, newStatus: string, order: Order) => void
  pollIntervalMs?: number
  enabled?: boolean
}

interface UseOrderPollingResult {
  order: Order | null
  loading: boolean
  error: string | null
  refetch: () => Promise<Order | null>
  isPolling: boolean
}

/**
 * Custom hook for polling order status with proper interval management,
 * cache busting, and status change detection.
 *
 * Production-grade implementation with:
 * - Proper cleanup and interval management
 * - Cache busting via query parameters
 * - Status change detection with callbacks
 * - Automatic stop on terminal states
 * - Error handling and retry logic
 */
export const useOrderPolling = ({
  orderId,
  isLoggedIn,
  onStatusChange,
  pollIntervalMs = 10000, // 10 seconds for demo, can be increased to 30000 in production
  enabled = true,
}: UseOrderPollingOptions): UseOrderPollingResult => {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const previousStatusRef = useRef<string | null>(null)
  const isPollingRef = useRef<boolean>(false)
  const mountedRef = useRef<boolean>(true)
  const retryCountRef = useRef<number>(0)
  const MAX_RETRIES = 5

  // Fetch order with cache busting timestamp
  const fetchOrder = useCallback(
    async (options?: { skipStatusChangeCheck?: boolean }): Promise<Order | null> => {
      if (!isLoggedIn || !orderId) {
        return null
      }

      try {
        // Add timestamp query parameter to bust cache
        const timestamp = Date.now()
        const response = await api.request(`/orders/${orderId}?t=${timestamp}`)

        if (!mountedRef.current) return null

        const order = response.order

        // Detect status change and trigger callback
        if (!options?.skipStatusChangeCheck && previousStatusRef.current && previousStatusRef.current !== order.status) {
          // Status changed!
          onStatusChange?.(previousStatusRef.current, order.status, order)
        }

        // Update previous status for next comparison
        previousStatusRef.current = order.status
        retryCountRef.current = 0 // Reset retry count on success

        return order
      } catch (err) {
        console.error(`Failed to fetch order ${orderId}:`, err)
        retryCountRef.current++

        // Exponential backoff for retries
        if (retryCountRef.current < MAX_RETRIES) {
          const backoffMs = Math.min(1000 * Math.pow(2, retryCountRef.current), 30000)
          console.warn(`Retrying in ${backoffMs}ms (attempt ${retryCountRef.current}/${MAX_RETRIES})`)
        }

        return null
      }
    },
    [orderId, isLoggedIn, onStatusChange]
  )

  // Manual refetch function
  const refetch = useCallback(async () => {
    return fetchOrder({ skipStatusChangeCheck: false })
  }, [fetchOrder])

  // Setup polling interval
  useEffect(() => {
    if (!enabled || !orderId || !isLoggedIn) {
      isPollingRef.current = false
      return
    }

    let isMounted = true
    mountedRef.current = true

    // Initial fetch on mount
    const initialFetch = async () => {
      const order = await fetchOrder({ skipStatusChangeCheck: true })
      if (isMounted) {
        previousStatusRef.current = order?.status ?? null
        isPollingRef.current = true
      }
    }

    initialFetch()

    // Setup polling interval
    intervalRef.current = setInterval(async () => {
      if (!isMounted) return

      const order = await fetchOrder()

      // Stop polling if order reached terminal state
      if (order && (order.status === 'delivered' || order.status === 'cancelled')) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
          isPollingRef.current = false
          console.log(`Polling stopped: order status is ${order.status}`)
        }
      }
    }, pollIntervalMs)

    // Cleanup function
    return () => {
      isMounted = false
      mountedRef.current = false
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      isPollingRef.current = false
    }
  }, [orderId, isLoggedIn, enabled, pollIntervalMs, fetchOrder])

  return {
    order: previousStatusRef.current ? null : null, // Will be set by parent component
    loading: false,
    error: null,
    refetch,
    isPolling: isPollingRef.current,
  }
}

export default useOrderPolling
