/**
 * Cart Service Layer
 * Business logic for cart operations
 * Handles guest and logged-in user flows
 */

import type { CartItem, CartOperationResult } from '../types/cart.types'
import {
  addToCartAPI,
  getCartAPI,
  updateCartQuantityAPI,
  removeFromCartAPI,
  syncCartAPI,
  toggleSaveForLaterAPI,
  clearCartAPI,
} from '../api/cart.api'
import {
  getLocalCart,
  setLocalCart,
  clearLocalCart,
  normalizeCartItem,
  isValidCartItem,
} from '../utils/cartStorage'

/**
 * Cart Service - Main interface for cart operations
 */
export class CartService {
  /**
   * Add item to cart
   * If logged in → API call
   * If guest → localStorage
   */
  static async addToCart(
    productId: string | number,
    quantity: number,
    isLoggedIn: boolean
  ): Promise<CartOperationResult> {
    try {
      if (quantity < 1 || quantity > 999) {
        return {
          success: false,
          error: 'Invalid quantity',
        }
      }

      if (isLoggedIn) {
        const response = await addToCartAPI({ productId, quantity })
        return {
          success: true,
          data: response,
          timestamp: new Date().toISOString(),
        }
      } else {
        const localCart = getLocalCart()
        const existingItem = localCart.find(
          (item) => String(item.productId) === String(productId)
        )

        if (existingItem) {
          existingItem.quantity += quantity
        } else {
          const newItem: CartItem = {
            productId,
            quantity,
            savedForLater: false,
          }
          if (isValidCartItem(newItem)) {
            localCart.push(normalizeCartItem(newItem))
          } else {
            return {
              success: false,
              error: 'Invalid cart item',
            }
          }
        }

        setLocalCart(localCart)
        
        // Return updated cart data for state update
        const activeCart = localCart.filter((item) => !item.savedForLater)
        const savedItems = localCart.filter((item) => item.savedForLater)
        
        return {
          success: true,
          data: {
            cart: activeCart,
            savedItems,
            total: 0, // Guest doesn't have pricing data
            itemCount: activeCart.length,
            savedCount: savedItems.length,
          },
          timestamp: new Date().toISOString(),
        }
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      }
    }
  }

  /**
   * Get cart
   * If logged in → fetch from API
   * If guest → return localStorage
   */
  static async getCart(isLoggedIn: boolean): Promise<CartOperationResult> {
    try {
      if (isLoggedIn) {
        const response = await getCartAPI()
        return {
          success: true,
          data: response,
          timestamp: new Date().toISOString(),
        }
      } else {
        const localCart = getLocalCart()
        const savedItems = localCart.filter((item) => item.savedForLater)
        const activeCart = localCart.filter((item) => !item.savedForLater)

        return {
          success: true,
          data: {
            cart: activeCart,
            savedItems,
            total: 0, // Can't calculate without product data
            itemCount: activeCart.length,
            savedCount: savedItems.length,
          },
        }
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      }
    }
  }

  /**
   * Update quantity
   * If logged in → API call
   * If guest → localStorage
   */
  static async updateQuantity(
    productId: string | number,
    quantity: number,
    isLoggedIn: boolean
  ): Promise<CartOperationResult> {
    try {
      if (quantity < 1 || quantity > 999) {
        return {
          success: false,
          error: 'Invalid quantity',
        }
      }

      if (isLoggedIn) {
        const response = await updateCartQuantityAPI({ productId, quantity })
        return {
          success: true,
          data: response,
          timestamp: new Date().toISOString(),
        }
      } else {
        const localCart = getLocalCart()
        const item = localCart.find((item) => String(item.productId) === String(productId))

        if (!item) {
          return {
            success: false,
            error: 'Item not found in cart',
          }
        }

        item.quantity = quantity
        setLocalCart(localCart)
        
        // Return updated cart data for state update
        const activeCart = localCart.filter((item) => !item.savedForLater)
        const savedItems = localCart.filter((item) => item.savedForLater)
        
        return {
          success: true,
          data: {
            cart: activeCart,
            savedItems,
            total: 0,
            itemCount: activeCart.length,
            savedCount: savedItems.length,
          },
          timestamp: new Date().toISOString(),
        }
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      }
    }
  }

  /**
   * Remove from cart
   * If logged in → API call
   * If guest → localStorage
   */
  static async removeFromCart(
    productId: string | number,
    isLoggedIn: boolean
  ): Promise<CartOperationResult> {
    try {
      if (isLoggedIn) {
        const response = await removeFromCartAPI(productId)
        return {
          success: true,
          data: response,
          timestamp: new Date().toISOString(),
        }
      } else {
        const localCart = getLocalCart()
        const filtered = localCart.filter((item) => String(item.productId) !== String(productId))

        if (filtered.length === localCart.length) {
          return {
            success: false,
            error: 'Item not found in cart',
          }
        }

        setLocalCart(filtered)
        
        // Return updated cart data for state update
        const activeCart = filtered.filter((item) => !item.savedForLater)
        const savedItems = filtered.filter((item) => item.savedForLater)
        
        return {
          success: true,
          data: {
            cart: activeCart,
            savedItems,
            total: 0,
            itemCount: activeCart.length,
            savedCount: savedItems.length,
          },
          timestamp: new Date().toISOString(),
        }
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      }
    }
  }

  /**
   * Sync guest cart with backend
   * Called when user logs in
   */
  static async syncGuestCart(): Promise<CartOperationResult> {
    try {
      const guestCart = getLocalCart()

      if (guestCart.length === 0) {
        return {
          success: true,
          timestamp: new Date().toISOString(),
        }
      }

      const response = await syncCartAPI({ items: guestCart })

      // Clear local cart after successful sync
      clearLocalCart()

      return {
        success: true,
        data: response,
        timestamp: new Date().toISOString(),
      }
    } catch (error: any) {
      // Don't clear cart on sync failure - user can try again
      return {
        success: false,
        error: error.message,
      }
    }
  }

  /**
   * Toggle save for later
   * Only for logged-in users
   */
  static async toggleSaveForLater(
    productId: string | number,
    savedForLater: boolean,
    isLoggedIn: boolean
  ): Promise<CartOperationResult> {
    try {
      if (isLoggedIn) {
        const response = await toggleSaveForLaterAPI(productId, savedForLater)
        return {
          success: true,
          data: response,
          timestamp: new Date().toISOString(),
        }
      } else {
        const localCart = getLocalCart()
        const item = localCart.find((item) => String(item.productId) === String(productId))

        if (!item) {
          return {
            success: false,
            error: 'Item not found in cart',
          }
        }

        item.savedForLater = savedForLater
        setLocalCart(localCart)
        return {
          success: true,
          timestamp: new Date().toISOString(),
        }
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      }
    }
  }

  /**
   * Clear entire cart
   * Only for logged-in users
   */
  static async clearCart(isLoggedIn: boolean): Promise<CartOperationResult> {
    try {
      if (isLoggedIn) {
        const response = await clearCartAPI()
        return {
          success: true,
          data: response,
          timestamp: new Date().toISOString(),
        }
      } else {
        clearLocalCart()
        return {
          success: true,
          timestamp: new Date().toISOString(),
        }
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      }
    }
  }

  /**
   * Handle logout - optionally persist cart
   */
  static handleLogout(persistCart: boolean = true): void {
    if (!persistCart) {
      clearLocalCart()
    }
  }
}

export default CartService
