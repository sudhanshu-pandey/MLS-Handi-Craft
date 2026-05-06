/**
 * Comprehensive validation and sanitization utilities
 * Enterprise-grade validation to prevent negative/invalid values
 */

/**
 * Sanitize numeric value - converts to absolute value and ensures non-negative
 * @param value - Input value
 * @param min - Minimum allowed value (default 0)
 * @param max - Maximum allowed value (optional)
 * @param fallback - Fallback value if invalid (default 0)
 */
export const sanitizeNumber = (
  value: any,
  min = 0,
  max?: number,
  fallback = 0
): number => {
  const parsed = Number(value)
  
  if (isNaN(parsed) || !isFinite(parsed)) {
    return fallback
  }
  
  // Always use absolute value to prevent negatives
  let sanitized = Math.abs(parsed)
  
  // Apply min constraint
  if (sanitized < min) {
    sanitized = min
  }
  
  // Apply max constraint
  if (max !== undefined && sanitized > max) {
    sanitized = max
  }
  
  return Math.floor(sanitized)
}

/**
 * Validate product price - must be positive
 */
export const validatePrice = (price: any): number => {
  return sanitizeNumber(price, 0, 9999999, 0)
}

/**
 * Validate stock quantity - must be non-negative
 */
export const validateStock = (stock: any): number => {
  return sanitizeNumber(stock, 0, 999999, 0)
}

/**
 * Validate discount value (amount or percentage)
 */
export const validateDiscount = (discount: any, isPercentage = false): number => {
  const max = isPercentage ? 100 : 9999999
  return sanitizeNumber(discount, 0, max, 0)
}

/**
 * Validate percentage value (0-100)
 */
export const validatePercentage = (percentage: any): number => {
  return sanitizeNumber(percentage, 0, 100, 0)
}

/**
 * Validate delivery fee
 */
export const validateDeliveryFee = (fee: any): number => {
  return sanitizeNumber(fee, 0, 99999, 0)
}

/**
 * Validate quantity
 */
export const validateQuantity = (quantity: any): number => {
  return sanitizeNumber(quantity, 0, 999999, 0)
}

/**
 * Safe number display - shows 0 for negative or invalid values
 */
export const safeDisplay = (value: any): number => {
  const parsed = Number(value)
  if (isNaN(parsed) || parsed < 0) {
    return 0
  }
  return Math.floor(parsed)
}

/**
 * Validate form data for numeric fields
 */
export const validateFormData = (data: Record<string, any>) => {
  const sanitized: Record<string, any> = {}
  
  for (const [key, value] of Object.entries(data)) {
    if (key.includes('price') || key.includes('Price')) {
      sanitized[key] = validatePrice(value)
    } else if (key.includes('discount') || key.includes('discount')) {
      sanitized[key] = validateDiscount(value)
    } else if (key.includes('stock') || key.includes('quantity') || key === 'stock' || key === 'quantity') {
      sanitized[key] = validateStock(value)
    } else if (key.includes('fee') || key.includes('Fee')) {
      sanitized[key] = validateDeliveryFee(value)
    } else if (key.includes('percentage') || key.includes('Percentage')) {
      sanitized[key] = validatePercentage(value)
    } else if (typeof value === 'number') {
      sanitized[key] = sanitizeNumber(value)
    } else {
      sanitized[key] = value
    }
  }
  
  return sanitized
}

/**
 * Ensure all numeric values in an array are non-negative
 */
export const sanitizeArray = <T extends Record<string, any>>(
  arr: T[],
  numericKeys: (keyof T)[]
): T[] => {
  return arr.map(item => {
    const sanitized = { ...item }
    numericKeys.forEach(key => {
      const value = sanitized[key]
      if (typeof value === 'number') {
        sanitized[key] = sanitizeNumber(value) as any
      }
    })
    return sanitized
  })
}

/**
 * Calculate totals safely (prevents negative sums)
 */
export const calculateTotal = (
  subtotal: any,
  deliveryFee: any = 0,
  discount: any = 0,
  tax: any = 0
): number => {
  const sub = sanitizeNumber(subtotal)
  const fee = sanitizeNumber(deliveryFee)
  const disc = sanitizeNumber(discount)
  const taxAmount = sanitizeNumber(tax)
  
  const total = sub + fee + taxAmount - disc
  
  // Total should never be negative
  return Math.max(0, total)
}

/**
 * Type guard for ensuring object is properly sanitized
 */
export const isValidNumeric = (value: any): boolean => {
  const parsed = Number(value)
  return !isNaN(parsed) && isFinite(parsed) && parsed >= 0
}


