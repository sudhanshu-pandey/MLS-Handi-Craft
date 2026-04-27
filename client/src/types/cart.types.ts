/**
 * Cart System Type Definitions
 * Enterprise-grade type safety for cart operations
 */

export interface Product {
  _id: string
  id?: number
  name: string
  price: number
  image?: string
  description?: string
  stock?: number
}

export interface CartItem {
  _id?: string
  productId: string | number
  product?: Product
  quantity: number
  savedForLater: boolean
  addedAt?: string
}

export interface CartResponse {
  cart: CartItem[]
  savedItems?: CartItem[]
  total: number
  itemCount: number
  savedCount?: number
  message?: string
}

export interface CartState {
  items: CartItem[]
  savedItems: CartItem[]
  loading: boolean
  error: string | null
  syncing: boolean
  total: number
  itemCount: number
}

export interface AddToCartPayload {
  productId: string | number
  quantity: number
}

export interface UpdateQuantityPayload {
  productId: string | number
  quantity: number
}

export interface RemoveFromCartPayload {
  productId: string | number
}

export interface SyncCartPayload {
  items: CartItem[]
}

export interface CartOperationResult {
  success: boolean
  data?: CartResponse
  error?: string
  timestamp?: string
}
