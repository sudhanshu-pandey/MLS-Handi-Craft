/**
 * Cart Storage Utilities
 * Handle localStorage operations with error handling and serialization
 */

import type { CartItem } from '../types/cart.types'

const STORAGE_KEYS = {
  GUEST_CART: 'hc_guest_cart_v2',
  SYNC_TIMESTAMP: 'hc_cart_sync_ts',
} as const

/**
 * Get guest cart from localStorage
 * @returns CartItem[] | null
 */
export const getLocalCart = (): CartItem[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.GUEST_CART)
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error('❌ [CartStorage] Error reading local cart:', error)
    return []
  }
}

/**
 * Set guest cart in localStorage
 * @param items - CartItem[]
 */
export const setLocalCart = (items: CartItem[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.GUEST_CART, JSON.stringify(items))
    localStorage.setItem(STORAGE_KEYS.SYNC_TIMESTAMP, new Date().toISOString())
  } catch (error) {
    console.error('❌ [CartStorage] Error writing local cart:', error)
  }
}

/**
 * Clear guest cart from localStorage
 */
export const clearLocalCart = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEYS.GUEST_CART)
    localStorage.removeItem(STORAGE_KEYS.SYNC_TIMESTAMP)
  } catch (error) {
    console.error('❌ [CartStorage] Error clearing local cart:', error)
  }
}

/**
 * Get last sync timestamp
 * @returns ISO string | null
 */
export const getLastSyncTime = (): string | null => {
  try {
    return localStorage.getItem(STORAGE_KEYS.SYNC_TIMESTAMP)
  } catch (error) {
    console.error('❌ [CartStorage] Error reading sync time:', error)
    return null
  }
}

/**
 * Merge guest cart with server cart
 * Handles duplicates by summing quantities
 */
export const mergeCartItems = (guestItems: CartItem[], serverItems: CartItem[]): CartItem[] => {
  const merged = [...serverItems]
  
  for (const guestItem of guestItems) {
    const existing = merged.find(
      (item) => String(item.productId) === String(guestItem.productId)
    )
    
    if (existing) {
      existing.quantity += guestItem.quantity
    } else {
      merged.push(guestItem)
    }
  }
  
  return merged
}

/**
 * Check if cart needs syncing
 * @returns boolean
 */
export const shouldSyncCart = (): boolean => {
  const lastSync = getLastSyncTime()
  if (!lastSync) return true
  
  const timeSinceSync = Date.now() - new Date(lastSync).getTime()
  const oneHour = 60 * 60 * 1000
  
  return timeSinceSync > oneHour
}

/**
 * Calculate cart total price
 */
export const calculateCartTotal = (items: CartItem[]): number => {
  return items.reduce((total, item) => {
    const price = item.product?.price || 0
    return total + price * item.quantity
  }, 0)
}

/**
 * Validate cart item
 */
export const isValidCartItem = (item: CartItem): boolean => {
  return (
    !!item.productId &&
    item.quantity > 0 &&
    item.quantity <= 999 &&
    typeof item.savedForLater === 'boolean'
  )
}

/**
 * Normalize cart item for API
 */
export const normalizeCartItem = (item: CartItem): CartItem => {
  return {
    productId: item.productId,
    quantity: Math.max(1, Math.min(999, Math.floor(item.quantity))),
    savedForLater: item.savedForLater ?? false,
  }
}
