import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface CartItem {
  productId: number | string;
  quantity: number;
  productName?: string;
  productPrice?: number;
  productImage?: string;
}

export interface CartState {
  items: CartItem[];
  itemCount: number;
  total: number;
}

const initialState: CartState = {
  items: [],
  itemCount: 0,
  total: 0,
};

/**
 * Cart Slice - Redux Toolkit
 * Manages all cart-related state and actions
 * Persists to localStorage automatically
 */
const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    // Load cart from localStorage
    loadCart: (state, action: PayloadAction<CartItem[]>) => {
      state.items = action.payload;
      state.itemCount = action.payload.length;
    },

    // Add item to cart
    // If item is already in cart, increase quantity
    addItem: (state, action: PayloadAction<{ productId: number | string; quantity: number; productName?: string; productPrice?: number; productImage?: string }>) => {
      const { productId, quantity, productName, productPrice, productImage } = action.payload;
      
      // Find existing item with flexible ID matching (handle numeric and string IDs)
      const existingItem = state.items.find((item) => {
        const existingIdStr = String(item.productId);
        const newIdStr = String(productId);
        return existingIdStr === newIdStr || item.productId === productId;
      });

      if (existingItem) {
        // If item is already in cart, increase quantity
        existingItem.quantity += quantity;
      } else {
        // Create new cart item with product details
        state.items.push({
          productId,
          quantity,
          productName,
          productPrice,
          productImage,
        });
      }

      // Update item count
      state.itemCount = state.items.length;
    },

    // Update item quantity
    updateQuantity: (state, action: PayloadAction<{ productId: number | string; quantity: number }>) => {
      const { productId, quantity } = action.payload;
      
      // Find item with flexible ID matching (handle numeric and string IDs)
      const item = state.items.find((item) => {
        const existingIdStr = String(item.productId);
        const newIdStr = String(productId);
        return existingIdStr === newIdStr || item.productId === productId;
      });

      if (item) {
        if (quantity <= 0) {
          // Remove item if quantity is 0 or less
          state.items = state.items.filter((item) => {
            const existingIdStr = String(item.productId);
            const newIdStr = String(productId);
            return !(existingIdStr === newIdStr || item.productId === productId);
          });
        } else {
          item.quantity = quantity;
        }
      }

      // Update item count
      state.itemCount = state.items.length;
    },

    // Remove item from cart
    removeItem: (state, action: PayloadAction<number | string>) => {
      const productId = action.payload;
      state.items = state.items.filter((item) => {
        const existingIdStr = String(item.productId);
        const newIdStr = String(productId);
        return !(existingIdStr === newIdStr || item.productId === productId);
      });
      state.itemCount = state.items.length;
    },

    // Clear entire cart
    clearCart: (state) => {
      state.items = [];
      state.itemCount = 0;
      state.total = 0;
    },

    // Set cart total (for future use with product prices)
    setTotal: (state, action: PayloadAction<number>) => {
      state.total = action.payload;
    },

    // Sync cart from server (for logged-in users)
    syncCart: (state, action: PayloadAction<CartItem[]>) => {
      state.items = action.payload;
      state.itemCount = action.payload.length;
    },
  },
});

export const {
  loadCart,
  addItem,
  updateQuantity,
  removeItem,
  clearCart,
  setTotal,
  syncCart,
} = cartSlice.actions;

export default cartSlice.reducer;
