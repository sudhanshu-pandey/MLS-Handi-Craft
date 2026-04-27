import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface CouponState {
  code: string;
  discountPct: number;
  discountAmount: number;
}

const initialState: CouponState = {
  code: '',
  discountPct: 0,
  discountAmount: 0,
};

/**
 * Coupon Slice - Redux Toolkit
 * Manages applied coupon state across pages
 * Persists to localStorage automatically
 */
const couponSlice = createSlice({
  name: 'coupon',
  initialState,
  reducers: {
    // Apply a coupon
    applyCoupon: (state, action: PayloadAction<CouponState>) => {
      state.code = action.payload.code;
      state.discountPct = action.payload.discountPct;
      state.discountAmount = action.payload.discountAmount;
    },

    // Remove the applied coupon
    removeCoupon: (state) => {
      state.code = '';
      state.discountPct = 0;
      state.discountAmount = 0;
    },

    // Clear coupon (used after order is placed)
    clearCoupon: (state) => {
      state.code = '';
      state.discountPct = 0;
      state.discountAmount = 0;
    },
  },
});

export const { applyCoupon, removeCoupon, clearCoupon } = couponSlice.actions;
export default couponSlice.reducer;
