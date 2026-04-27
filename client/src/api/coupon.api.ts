/**
 * Coupon API Service
 * Handles all coupon-related API calls
 * Fetches coupons from backend database
 */

import api from '../services/api'

export interface CouponResponse {
  code: string
  description: string
  discountType: 'percentage' | 'fixed'
  discountValue: number
  maxDiscountAmount?: number
  minOrderAmount: number
  usageLimit?: number
  expiryDate?: string
  isActive: boolean
}

export interface VerifyCouponRequest {
  code: string
  orderAmount: number
}

export interface VerifyCouponResponse {
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
 * Get all active coupons from database
 * @returns Array of available coupons
 */
export const getAllCoupons = async (): Promise<CouponResponse[]> => {
  try {
    const response = await api.request('/coupons')
    return response.data || []
  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch coupons')
  }
}

/**
 * Verify and apply coupon to cart
 * Checks validity, expiry, usage limits, and minimum order amount
 * @param code - Coupon code
 * @param orderAmount - Current cart total
 * @returns Coupon details with calculated discount
 */
export const verifyCoupon = async (
  code: string,
  orderAmount: number
): Promise<VerifyCouponResponse> => {
  try {
    const response = await api.request('/coupons/verify', {
      method: 'POST',
      body: JSON.stringify({
        code,
        orderAmount,
      }),
    })
    return response
  } catch (error: any) {
    const errorMessage = error.message || 'Failed to verify coupon'
    return {
      success: false,
      message: errorMessage,
    }
  }
}

/**
 * Get coupon details by code
 * @param code - Coupon code
 * @returns Coupon details
 */
export const getCouponByCode = async (code: string): Promise<CouponResponse | null> => {
  try {
    const response = await api.request(`/coupons/${code}`)
    return response.data || null
  } catch (error: any) {
    return null
  }
}
