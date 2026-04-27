/**
 * Cart API Service
 * Enterprise-grade API calls for cart operations
 * Handles guest and logged-in user flows
 */

import type {
  AddToCartPayload,
  CartResponse,
  UpdateQuantityPayload,
  SyncCartPayload,
} from '../types/cart.types'
import api from '../services/api'

/**
 * Add product to cart
 * @param payload - { productId, quantity }
 * @returns CartResponse
 */
export const addToCartAPI = async (payload: AddToCartPayload): Promise<CartResponse> => {
  try {
    const response = await api.addToCart(payload.productId, payload.quantity)
    return response
  } catch (error: any) {
    console.error('🔴 [CartAPI] Add to cart failed:', error.message)
    throw new Error(error.message || 'Failed to add item to cart')
  }
}

/**
 * Get user's cart from backend
 * @returns CartResponse
 */
export const getCartAPI = async (): Promise<CartResponse> => {
  try {
    const response = await api.getCart()
    return response
  } catch (error: any) {
    console.error('🔴 [CartAPI] Get cart failed:', error.message)
    throw new Error(error.message || 'Failed to fetch cart')
  }
}

/**
 * Update cart item quantity
 * @param payload - { productId, quantity }
 * @returns CartResponse
 */
export const updateCartQuantityAPI = async (
  payload: UpdateQuantityPayload
): Promise<CartResponse> => {
  try {
    const response = await api.updateCartQuantity(payload.productId, payload.quantity)
    return response
  } catch (error: any) {
    console.error('🔴 [CartAPI] Update quantity failed:', error.message)
    throw new Error(error.message || 'Failed to update cart')
  }
}

/**
 * Remove item from cart
 * @param productId - string | number
 * @returns CartResponse
 */
export const removeFromCartAPI = async (productId: string | number): Promise<CartResponse> => {
  try {
    const response = await api.removeFromCart(productId)
    return response
  } catch (error: any) {
    console.error('🔴 [CartAPI] Remove from cart failed:', error.message)
    throw new Error(error.message || 'Failed to remove item from cart')
  }
}

/**
 * Sync guest cart with backend
 * Called when user logs in
 * @param payload - { items: CartItem[] }
 * @returns CartResponse
 */
export const syncCartAPI = async (payload: SyncCartPayload): Promise<CartResponse> => {
  try {
    // Note: This endpoint needs to be added to backend if not exists
    const response = await api.request('/cart/sync', {
      method: 'POST',
      body: JSON.stringify({ items: payload.items }),
    })
    return response
  } catch (error: any) {
    console.error('🔴 [CartAPI] Cart sync failed:', error.message)
    throw new Error(error.message || 'Failed to sync cart')
  }
}

/**
 * Toggle save for later
 * @param productId - string | number
 * @param savedForLater - boolean
 * @returns CartResponse
 */
export const toggleSaveForLaterAPI = async (
  productId: string | number,
  savedForLater: boolean
): Promise<CartResponse> => {
  try {
    const response = await api.toggleSaveForLater(productId, savedForLater)
    return response
  } catch (error: any) {
    console.error('🔴 [CartAPI] Save for later failed:', error.message)
    throw new Error(error.message || 'Failed to update save for later')
  }
}

/**
 * Clear entire cart
 * @returns CartResponse
 */
export const clearCartAPI = async (): Promise<CartResponse> => {
  try {
    const response = await api.clearCart()
    return response
  } catch (error: any) {
    console.error('🔴 [CartAPI] Clear cart failed:', error.message)
    throw new Error(error.message || 'Failed to clear cart')
  }
}
