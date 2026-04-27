import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface WishlistItem {
  productId: number | string;
  addedAt: string;
}

export interface WishlistState {
  items: WishlistItem[];
  itemCount: number;
}

const initialState: WishlistState = {
  items: [],
  itemCount: 0,
};

/**
 * Wishlist Slice - Redux Toolkit
 * Manages saved for later / wishlist items
 * Persists to localStorage automatically
 */
const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
    // Load wishlist from localStorage
    loadWishlist: (state, action: PayloadAction<WishlistItem[]>) => {
      state.items = action.payload;
      state.itemCount = action.payload.length;
    },

    // Add item to wishlist (save for later)
    addItem: (state, action: PayloadAction<number | string>) => {
      const productId = action.payload;
      const existingItem = state.items.find((item) => item.productId === productId);

      if (!existingItem) {
        state.items.push({
          productId,
          addedAt: new Date().toISOString(),
        });
        state.itemCount = state.items.length;
      }
    },

    // Remove item from wishlist
    removeItem: (state, action: PayloadAction<number | string>) => {
      const productId = action.payload;
      state.items = state.items.filter((item) => item.productId !== productId);
      state.itemCount = state.items.length;
    },

    // Remove multiple items
    removeItems: (state, action: PayloadAction<(number | string)[]>) => {
      const productIds = action.payload;
      state.items = state.items.filter((item) => !productIds.includes(item.productId));
      state.itemCount = state.items.length;
    },

    // Clear entire wishlist
    clearWishlist: (state) => {
      state.items = [];
      state.itemCount = 0;
    },

    // Sync wishlist from server (for logged-in users)
    syncWishlist: (state, action: PayloadAction<WishlistItem[]>) => {
      state.items = action.payload;
      state.itemCount = action.payload.length;
    },
  },
});

export const {
  loadWishlist,
  addItem,
  removeItem,
  removeItems,
  clearWishlist,
  syncWishlist,
} = wishlistSlice.actions;

export default wishlistSlice.reducer;
