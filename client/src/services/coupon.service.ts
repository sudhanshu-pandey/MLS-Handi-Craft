import axios from 'axios'
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export interface ICoupon {
  _id: string
  code: string
  description: string
  discountType: 'percentage' | 'fixed'
  discountValue: number
  minOrderAmount: number
  maxDiscountAmount?: number
  usageLimit?: number
  usageCount: number
  expiryDate: string
  isActive: boolean
  applicableCategories?: string[]
  createdAt: string
  updatedAt: string
}

export interface CouponVerifyResponse {
  success: boolean
  message: string
  data?: {
    code: string
    description: string
    discountType: 'percentage' | 'fixed'
    discountValue: number
    maxDiscountAmount?: number
    discountAmount: number
    finalAmount: number
  }
}

/**
 * Fetch all active coupons from backend
 */
export const fetchAllCoupons = async (): Promise<ICoupon[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/coupons`)
    return response.data.data || []
  } catch (error) {
    return []
  }
}

/**
 * Verify coupon code with order amount
 * @param code - Coupon code
 * @param orderAmount - Total order amount
 */
export const verifyCoupon = async (
  code: string,
  orderAmount: number
): Promise<CouponVerifyResponse> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/coupons/verify`, {
      code: code.trim().toUpperCase(),
      orderAmount,
    })
    return response.data
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || 'Error verifying coupon',
    }
  }
}

/**
 * Get specific coupon by code
 */
export const getCouponByCode = async (code: string): Promise<ICoupon | null> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/coupons/${code.toUpperCase()}`)
    return response.data.data || null
  } catch (error) {
    return null
  }
}
