import { Middleware } from '@reduxjs/toolkit';

/**
 * Coupon Persistence Middleware
 * Saves and loads coupon state to/from localStorage
 */
export const couponPersistenceMiddleware: Middleware = (store) => (next) => (action: any) => {
  const result = next(action);
  
  // Save coupon to localStorage whenever it changes
  if (action.type.startsWith('coupon/')) {
    const { coupon } = store.getState();
    if (coupon.code) {
      localStorage.setItem('appliedCoupon', JSON.stringify(coupon));
    } else {
      localStorage.removeItem('appliedCoupon');
    }
  }
  
  return result;
};

/**
 * Load coupon from localStorage
 */
export const loadCouponFromStorage = () => {
  try {
    const stored = localStorage.getItem('appliedCoupon');
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Error loading coupon from storage:', error);
    return null;
  }
};
