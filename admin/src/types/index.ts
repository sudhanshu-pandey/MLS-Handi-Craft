// ============ AUTH TYPES ============
export interface AdminUser {
  _id: string
  name: string
  email: string
  role: 'admin' | 'manager' | 'support'
  avatar?: string
  lastLogin?: string
}

export interface AuthState {
  user: AdminUser | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

// ============ PRODUCT TYPES ============
export interface Product {
  _id: string
  name: string
  description: string
  price: number
  originalPrice: number
  images: string[]
  videos?: string[]
  category: string
  rating: number
  reviewCount: number
  stock: number
  artisan?: {
    name: string
    region: string
    craftType: string
  }
  artisanInfo?: {
    name: string
    region: string
    craftType: string
  }
  specifications?: {
    dimensions?: string
    weight?: string
    origin?: string
    material?: string
    dimension?: string
    category?: string
    countryOfOrigin?: string
  }
  tags?: string[]
  createdAt: string
  updatedAt: string
}

export interface ProductFormData {
  name: string
  description: string
  price: number
  originalPrice: number
  images: string[]
  videos?: string[]
  category: string
  stock: number
  artisan?: {
    name: string
    region: string
    craftType: string
  }
  specifications?: Record<string, string>
  tags?: string[]
}

// ============ ORDER TYPES ============
export type OrderStatus = 'ordered' | 'packed' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'pending' | 'confirmed' | 'returned'
export type PaymentStatus = 'pending' | 'success' | 'failed' | 'cancelled'
export type PaymentMethod = 'cod' | 'razorpay' | 'upi' | 'card'

export interface OrderItem {
  productId: string | Product
  name: string
  image: string
  price: number
  quantity: number
}

export interface DeliveryAddress {
  fullName: string
  phone: string
  addressLine1: string
  addressLine2?: string
  city: string
  state: string
  pincode: string
}

export interface Order {
  _id: string
  user: User | string
  items: OrderItem[]
  subtotal: number
  deliveryFee: number
  discount: number
  total: number
  coupon?: {
    code: string
    discount: number
  }
  deliveryAddress?: DeliveryAddress
  address?: {
    fullName?: string
    phone?: string
    line1?: string
    line2?: string
    city?: string
    state?: string
    pincode?: string
    landmark?: string
  }
  status: OrderStatus
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  razorpayOrderId?: string
  razorpayPaymentId?: string
  estimatedDelivery?: string
  refundStatus?: string
  supportTickets?: Array<{
    message: string
    createdAt: string
    status: string
  }>
  createdAt: string
  updatedAt: string
}

// ============ USER TYPES ============
export interface User {
  _id: string
  phone: string
  name?: string
  email?: string
  gender?: string
  dateOfBirth?: string
  addresses?: DeliveryAddress[]
  wishlist?: string[]
  recentlyViewed?: string[]
  isBlocked?: boolean
  createdAt: string
  updatedAt: string
}

// ============ CATEGORY TYPES ============
export interface Category {
  _id: string
  name: string
  slug: string
  description?: string
  image?: string
  images?: string[]
  isActive: boolean
  productCount?: number
  createdAt: string
}

// ============ COUPON TYPES ============
export interface Coupon {
  _id: string
  code: string
  discountType: 'percentage' | 'fixed'
  discountValue: number
  minOrderAmount?: number
  maxDiscount?: number
  usageLimit?: number
  usedCount: number
  expiryDate?: string
  isActive: boolean
  createdAt: string
}

// ============ BANNER TYPES ============
export interface Banner {
  _id: string
  title: string
  subtitle?: string
  image: string
  images?: string[]
  link?: string
  order: number
  isActive: boolean
  createdAt: string
}

// ============ ANALYTICS TYPES ============
export interface RevenueData {
  date: string
  revenue: number
  orders: number
}

export interface CategoryRevenue {
  category: string
  revenue: number
  orders: number
  percentage: number
}

export interface KPIData {
  totalRevenue: number
  revenueChange: number
  totalOrders: number
  ordersChange: number
  totalUsers: number
  usersChange: number
  avgOrderValue: number
  aovChange: number
  conversionRate: number
  conversionChange: number
  todayOrders: number
  monthOrders: number
}

// ============ PAGINATION ============
export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: PaginationMeta
}

// ============ COMMON ============
export interface SelectOption {
  value: string
  label: string
}

export interface ApiError {
  message: string
  statusCode?: number
}

export type DateRange = {
  startDate: Date | null
  endDate: Date | null
}

export interface Notification {
  id: string
  type: 'order' | 'stock' | 'user' | 'payment'
  title: string
  message: string
  isRead: boolean
  createdAt: string
}
