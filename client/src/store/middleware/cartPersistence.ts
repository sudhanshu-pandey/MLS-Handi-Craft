import { Middleware } from '@reduxjs/toolkit';
import type { RootState } from '../store';

const CART_STORAGE_KEY = 'hc_cart_v1';
const WISHLIST_STORAGE_KEY = 'hc_wishlist_v1';

/**
 * Redux Middleware for localStorage persistence
 * Automatically saves cart and wishlist state to localStorage on changes
 * Loads state from localStorage on app startup
 */
export const cartPersistenceMiddleware: Middleware<
  (action: any) => any,
  RootState
> = (store) => (next) => (action: any) => {
  // Call the reducer
  const result = next(action);

  // Save to localStorage after state updates for cart and wishlist actions
  const actionType = action?.type || '';
  if (actionType.includes('cart') || actionType.includes('wishlist')) {
    const state = store.getState();
    try {
      // Persist cart (always save, even if empty - ensures localStorage stays in sync)
      const cartData = state.cart.items;
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartData));

      // Persist wishlist (always save, even if empty)
      const wishlistData = state.wishlist.items;
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlistData));
    } catch (error) {
      // Failed to persist state to localStorage
    }
  }

  return result;
};

/**
 * Load cart from localStorage
 * Call this in your app initialization
 */
export const loadCartFromLocalStorage = () => {
  try {
    const data = localStorage.getItem(CART_STORAGE_KEY);
    const parsed = data ? JSON.parse(data) : [];
    return parsed;
  } catch (error) {
    return [];
  }
};

/**
 * Load wishlist from localStorage
 * Call this in your app initialization
 */
export const loadWishlistFromLocalStorage = () => {
  try {
    const data = localStorage.getItem(WISHLIST_STORAGE_KEY);
    const parsed = data ? JSON.parse(data) : [];
    return parsed;
  } catch (error) {
    return [];
  }
};

