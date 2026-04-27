import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react'

export type AnalyticsEventType = 'product_viewed' | 'added_to_cart' | 'checkout_started'

export interface AnalyticsEvent {
  id: string
  type: AnalyticsEventType
  timestamp: string
  payload: Record<string, string | number | boolean>
}

export interface CartItem {
  productId: number
  quantity: number
  savedForLater: boolean
}

export interface Address {
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

export interface Order {
  id: string
  productIds: number[]
  total: number
  paymentMethod: string
  paymentStatus: 'success' | 'failed'
  createdAt: string
  estimatedDelivery: string
  status: 'ordered' | 'packed' | 'shipped' | 'out_for_delivery' | 'delivered'
  addressId: string
}

interface CommerceContextValue {
  cart: CartItem[]
  wishlist: number[]
  recentlyViewed: number[]
  savedPincode: string
  addresses: Address[]
  orders: Order[]
  analyticsEvents: AnalyticsEvent[]
  addToCart: (productId: number, quantity?: number) => void
  updateCartQuantity: (productId: number, quantity: number) => void
  removeFromCart: (productId: number) => void
  toggleSaveForLater: (productId: number) => void
  clearCart: () => void
  toggleWishlist: (productId: number) => void
  addRecentlyViewed: (productId: number) => void
  setSavedPincode: (pincode: string) => void
  upsertAddress: (address: Address) => void
  removeAddress: (id: string) => void
  createOrder: (input: Omit<Order, 'id' | 'createdAt'>) => Order
  trackEvent: (type: AnalyticsEventType, payload: Record<string, string | number | boolean>) => void
}

const CART_KEY = 'hc_cart_v1'
const WISHLIST_KEY = 'hc_wishlist_v1'
const RECENTLY_VIEWED_KEY = 'hc_recently_viewed_v1'
const PINCODE_KEY = 'hc_pincode_v1'
const ADDRESS_KEY = 'hc_addresses_v1'
const ORDERS_KEY = 'hc_orders_v1'

const CommerceContext = createContext<CommerceContextValue | undefined>(undefined)

const getFromStorage = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) {
      return fallback
    }
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

const setInStorage = (key: string, value: unknown) => {
  localStorage.setItem(key, JSON.stringify(value))
}

export const CommerceProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>(() => getFromStorage<CartItem[]>(CART_KEY, []))
  const [wishlist, setWishlist] = useState<number[]>(() => getFromStorage<number[]>(WISHLIST_KEY, []))
  const [recentlyViewed, setRecentlyViewed] = useState<number[]>(() => getFromStorage<number[]>(RECENTLY_VIEWED_KEY, []))
  const [savedPincode, setSavedPincodeState] = useState<string>(() => getFromStorage<string>(PINCODE_KEY, ''))
  const [addresses, setAddresses] = useState<Address[]>(() => getFromStorage<Address[]>(ADDRESS_KEY, []))
  const [orders, setOrders] = useState<Order[]>(() => getFromStorage<Order[]>(ORDERS_KEY, []))
  const [analyticsEvents, setAnalyticsEvents] = useState<AnalyticsEvent[]>([])

  const addToCart = useCallback((productId: number, quantity = 1) => {
    setCart((current) => {
      const existing = current.find((item) => item.productId === productId)
      const next = existing
        ? current.map((item) =>
            item.productId === productId
              ? { ...item, quantity: Math.max(1, item.quantity + quantity), savedForLater: false }
              : item,
          )
        : [...current, { productId, quantity: Math.max(1, quantity), savedForLater: false }]

      setInStorage(CART_KEY, next)
      return next
    })
  }, [])

  const updateCartQuantity = useCallback((productId: number, quantity: number) => {
    setCart((current) => {
      const next = current.map((item) =>
        item.productId === productId
          ? { ...item, quantity: Math.max(1, quantity) }
          : item,
      )
      setInStorage(CART_KEY, next)
      return next
    })
  }, [])

  const removeFromCart = useCallback((productId: number) => {
    setCart((current) => {
      const next = current.filter((item) => item.productId !== productId)
      setInStorage(CART_KEY, next)
      return next
    })
  }, [])

  const toggleSaveForLater = useCallback((productId: number) => {
    setCart((current) => {
      const next = current.map((item) =>
        item.productId === productId
          ? { ...item, savedForLater: !item.savedForLater }
          : item,
      )
      setInStorage(CART_KEY, next)
      return next
    })
  }, [])

  const clearCart = useCallback(() => {
    setCart([])
    setInStorage(CART_KEY, [])
  }, [])

  const toggleWishlist = useCallback((productId: number) => {
    setWishlist((current) => {
      const next = current.includes(productId)
        ? current.filter((id) => id !== productId)
        : [...current, productId]
      setInStorage(WISHLIST_KEY, next)
      return next
    })
  }, [])

  const addRecentlyViewed = useCallback((productId: number) => {
    setRecentlyViewed((current) => {
      const deduped = current.filter((id) => id !== productId)
      const next = [productId, ...deduped].slice(0, 12)
      setInStorage(RECENTLY_VIEWED_KEY, next)
      return next
    })
  }, [])

  const setSavedPincode = useCallback((pincode: string) => {
    setSavedPincodeState(pincode)
    setInStorage(PINCODE_KEY, pincode)
  }, [])

  const upsertAddress = useCallback((address: Address) => {
    setAddresses((current) => {
      const exists = current.some((item) => item.id === address.id)
      const withDefault = address.isDefault
        ? current.map((item) => ({ ...item, isDefault: false }))
        : current
      const next = exists
        ? withDefault.map((item) => (item.id === address.id ? address : item))
        : [...withDefault, address]
      setInStorage(ADDRESS_KEY, next)
      return next
    })
  }, [])

  const removeAddress = useCallback((id: string) => {
    setAddresses((current) => {
      const next = current.filter((item) => item.id !== id)
      setInStorage(ADDRESS_KEY, next)
      return next
    })
  }, [])

  const createOrder = useCallback((input: Omit<Order, 'id' | 'createdAt'>): Order => {
    const order: Order = {
      ...input,
      id: `ORD-${Date.now().toString().slice(-8)}`,
      createdAt: new Date().toISOString(),
    }

    setOrders((current) => {
      const next = [order, ...current]
      setInStorage(ORDERS_KEY, next)
      return next
    })

    return order
  }, [])

  const trackEvent = useCallback((type: AnalyticsEventType, payload: Record<string, string | number | boolean>) => {
    setAnalyticsEvents((current) => [
      {
        id: `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        type,
        payload,
        timestamp: new Date().toISOString(),
      },
      ...current,
    ])
  }, [])

  const value = useMemo(
    () => ({
      cart,
      wishlist,
      recentlyViewed,
      savedPincode,
      addresses,
      orders,
      analyticsEvents,
      addToCart,
      updateCartQuantity,
      removeFromCart,
      toggleSaveForLater,
      clearCart,
      toggleWishlist,
      addRecentlyViewed,
      setSavedPincode,
      upsertAddress,
      removeAddress,
      createOrder,
      trackEvent,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cart, wishlist, recentlyViewed, savedPincode, addresses, orders, analyticsEvents, addToCart, updateCartQuantity, removeFromCart, toggleSaveForLater, clearCart, toggleWishlist, addRecentlyViewed, setSavedPincode, upsertAddress, removeAddress, createOrder, trackEvent],
  )

  return <CommerceContext.Provider value={value}>{children}</CommerceContext.Provider>
}

export const useCommerce = () => {
  const context = useContext(CommerceContext)

  if (!context) {
    throw new Error('useCommerce must be used within CommerceProvider')
  }

  return context
}
