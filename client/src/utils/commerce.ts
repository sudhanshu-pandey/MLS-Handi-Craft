import { Product } from '../data/products'
import api from '../services/api'

export const formatCurrency = (value: number) => `₹${value.toLocaleString('en-IN')}`

export const calculateDiscountPercent = (price: number, originalPrice?: number) => {
  if (!originalPrice || originalPrice <= price) {
    return 0
  }
  return Math.round(((originalPrice - price) / originalPrice) * 100)
}

export const getStockCount = (productId: number | string) => {
  // Handle both numeric and string IDs
  let numericId = typeof productId === 'string' ? productId.charCodeAt(0) : productId
  
  // Fallback to a default if numericId is invalid
  if (isNaN(numericId) || numericId === 0) {
    numericId = 15
  }
  
  const seed = (numericId * 13) % 10
  return seed < 3 ? seed + 1 : seed + 3
}

/**
 * Fetch delivery estimate from API
 * Replaces hardcoded logic with real API data
 */
export const estimateDeliveryByPincode = async (pincode: string) => {
  try {
    const normalized = pincode.trim()

    if (!normalized || !/^\d{6}$/.test(normalized)) {
      return {
        isServiceable: false,
        shippingCost: 0,
        estimatedDate: '',
        estimatedDays: 0,
        message: 'Enter a valid 6-digit pincode',
        city: '',
        state: '',
      }
    }

    // Call the API
    const response = await api.lookupPincode(normalized)

    if (!response.success) {
      return {
        isServiceable: false,
        shippingCost: 0,
        estimatedDate: '',
        estimatedDays: 0,
        message: 'Delivery not available for this pincode',
        city: '',
        state: '',
      }
    }

    const data = response.data
    const deliveryEstimate = data.deliveryEstimate
    console.log('Delivery estimate data:', deliveryEstimate)
    // Calculate estimated delivery date
    const deliveryDate = new Date()
    deliveryDate.setDate(deliveryDate.getDate() + deliveryEstimate.minDays)

    return {
      isServiceable: true,
      shippingCost: deliveryEstimate.deliveryCharge.amount,
      estimatedDate: deliveryDate.toLocaleDateString('en-IN', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
      }),
      estimatedDays: deliveryEstimate.minDays,
      message: deliveryEstimate.deliveryCharge.amount === 0
        ? 'Free delivery available'
        : `Shipping ₹${deliveryEstimate.deliveryCharge.amount}`,
      city: data.city,
      state: data.state,
    }
  } catch (error) {
    console.error('Delivery estimate error:', error)
    return {
      isServiceable: false,
      shippingCost: 0,
      estimatedDate: '',
      estimatedDays: 0,
      message: 'Unable to fetch delivery estimate',
      city: '',
      state: '',
    }
  }
}

export const getProductById = (products: Product[], id: number) => products.find((item) => item.id === id)

export const sumCartValue = (items: Array<{ product: Product; quantity: number }>) =>
  items.reduce((total, item) => total + item.product.price * item.quantity, 0)

export const sumOriginalCartValue = (items: Array<{ product: Product; quantity: number }>) =>
  items.reduce(
    (total, item) => total + (item.product.originalPrice ?? item.product.price) * item.quantity,
    0,
  )
