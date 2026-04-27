import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../services/api';

/**
 * Product Slice - Redux Toolkit
 * Manages product state including fetching from backend
 */

export interface Product {
  _id?: string;
  id?: number;
  name: string;
  description?: string;
  price: number;
  originalPrice?: number;
  image: string;
  images?: string[];
  category: string;
  rating?: number;
  reviewCount?: number;
  stock?: number;
  sale?: boolean;
  artisanInfo?: {
    name?: string;
    region?: string;
    craftType?: string;
  };
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductState {
  items: Product[];
  allProducts: Product[];
  loading: boolean;
  error: string | null;
  totalProducts: number;
  currentPage: number;
  totalPages: number;
}

const initialState: ProductState = {
  items: [],
  allProducts: [],
  loading: false,
  error: null,
  totalProducts: 0,
  currentPage: 1,
  totalPages: 0,
};

/**
 * Async thunk to fetch all products from backend
 * @param pagination - Optional pagination params
 * @returns Products array from backend
 */
export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async (
    pagination: { page?: number; limit?: number } = {},
    { rejectWithValue }
  ) => {
    try {
      const params = new URLSearchParams();
      if (pagination.page) params.append('page', String(pagination.page));
      if (pagination.limit) params.append('limit', String(pagination.limit));

      const response = await api.request(`/products?${params.toString()}`);
      
      return {
        products: response.products || [],
        total: response.total || 0,
        page: response.page || 1,
        pages: response.pages || 1,
        limit: response.limit || 20,
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch products');
    }
  }
);

/**
 * Async thunk to fetch products by category
 * @param category - Category name
 * @returns Products array for that category
 */
export const fetchProductsByCategory = createAsyncThunk(
  'products/fetchByCategory',
  async (category: string, { rejectWithValue }) => {
    try {
      const response = await api.request(`/products/category/${category}`);
      return response.products || [];
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch products');
    }
  }
);

/**
 * Async thunk to fetch single product by ID
 * @param productId - Product MongoDB ObjectId or numeric ID
 * @returns Single product object
 */
export const fetchProductById = createAsyncThunk(
  'products/fetchById',
  async (productId: string | number, { rejectWithValue }) => {
    try {
      const response = await api.request(`/products/${productId}`);
      return response.product || response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch product');
    }
  }
);

const productSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    // Clear error message
    clearError: (state) => {
      state.error = null;
    },
    // Reset products state
    resetProducts: (state) => {
      state.items = [];
      state.allProducts = [];
      state.loading = false;
      state.error = null;
      state.totalProducts = 0;
      state.currentPage = 1;
      state.totalPages = 0;
    },
  },
  extraReducers: (builder) => {
    // Fetch all products
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchProducts.fulfilled,
        (state, action: PayloadAction<any>) => {
          state.loading = false;
          state.allProducts = action.payload.products;
          state.items = action.payload.products;
          state.totalProducts = action.payload.total;
          state.currentPage = action.payload.page;
          state.totalPages = action.payload.pages;
        }
      )
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch products by category
    builder
      .addCase(fetchProductsByCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchProductsByCategory.fulfilled,
        (state, action: PayloadAction<Product[]>) => {
          state.loading = false;
          state.items = action.payload;
        }
      )
      .addCase(fetchProductsByCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch product by ID
    builder
      .addCase(fetchProductById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProductById.fulfilled, (state, action: PayloadAction<Product>) => {
        state.loading = false;
        // Update product in items if exists, otherwise add it
        const index = state.items.findIndex(
          (p) => p._id === action.payload._id || p.id === action.payload.id
        );
        if (index >= 0) {
          state.items[index] = action.payload;
        } else {
          state.items.push(action.payload);
        }
        
        // Also add/update in allProducts for consistency
        const allProductsIndex = state.allProducts.findIndex(
          (p) => p._id === action.payload._id || p.id === action.payload.id
        );
        if (allProductsIndex >= 0) {
          state.allProducts[allProductsIndex] = action.payload;
        } else {
          state.allProducts.push(action.payload);
        }
      })
      .addCase(fetchProductById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, resetProducts } = productSlice.actions;
export default productSlice.reducer;
