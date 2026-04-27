import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../store';

/**
 * Filter and Sort Slice - Redux Toolkit
 * Manages product filtering and sorting state
 */

export type SortOption = 'price_asc' | 'price_desc' | 'newest' | 'popularity' | 'none';
export type RatingFilter = 4 | 4.5 | 5 | 'none';

export interface FilterState {
  // Sorting
  sort: SortOption;

  // Price Filter
  minPrice: number;
  maxPrice: number;

  // Category Filter
  selectedCategories: string[];

  // Rating Filter
  minRating: RatingFilter;

  // Availability Filter
  inStockOnly: boolean;

  // UI State
  isFilterModalOpen: boolean;
  isLoading: boolean;
}

const initialState: FilterState = {
  sort: 'none',
  minPrice: 0,
  maxPrice: 100000,
  selectedCategories: [],
  minRating: 'none',
  inStockOnly: false,
  isFilterModalOpen: false,
  isLoading: false,
};

const filterSlice = createSlice({
  name: 'filters',
  initialState,
  reducers: {
    // Sorting actions
    setSortOption: (state, action: PayloadAction<SortOption>) => {
      state.sort = action.payload;
    },

    // Price filter actions
    setPriceRange: (
      state,
      action: PayloadAction<{ min: number; max: number }>
    ) => {
      const { min, max } = action.payload;
      if (min <= max) {
        state.minPrice = min;
        state.maxPrice = max;
      }
    },

    setMinPrice: (state, action: PayloadAction<number>) => {
      state.minPrice = action.payload;
    },

    setMaxPrice: (state, action: PayloadAction<number>) => {
      state.maxPrice = action.payload;
    },

    // Category filter actions
    toggleCategory: (state, action: PayloadAction<string>) => {
      const category = action.payload;
      const index = state.selectedCategories.indexOf(category);

      if (index > -1) {
        state.selectedCategories.splice(index, 1);
      } else {
        state.selectedCategories.push(category);
      }
    },

    setCategories: (state, action: PayloadAction<string[]>) => {
      state.selectedCategories = action.payload;
    },

    // Rating filter actions
    setMinRating: (state, action: PayloadAction<RatingFilter>) => {
      state.minRating = action.payload;
    },

    // Availability filter actions
    setInStockOnly: (state, action: PayloadAction<boolean>) => {
      state.inStockOnly = action.payload;
    },

    // Modal state actions
    openFilterModal: (state) => {
      state.isFilterModalOpen = true;
    },

    closeFilterModal: (state) => {
      state.isFilterModalOpen = false;
    },

    // Loading state
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    // Clear all filters
    clearAllFilters: (state) => {
      state.minPrice = 0;
      state.maxPrice = 100000;
      state.selectedCategories = [];
      state.minRating = 'none';
      state.inStockOnly = false;
      state.sort = 'none';
    },

    // Reset filters but keep sort
    resetFiltersKeepSort: (state) => {
      state.minPrice = 0;
      state.maxPrice = 100000;
      state.selectedCategories = [];
      state.minRating = 'none';
      state.inStockOnly = false;
    },

    // Load filters from localStorage
    loadFiltersFromStorage: (state, action: PayloadAction<Partial<FilterState>>) => {
      return { ...state, ...action.payload };
    },
  },
});

// Selectors
export const selectFilterState = (state: RootState) => state.filters;
export const selectSort = (state: RootState) => state.filters.sort;
export const selectPriceRange = (state: RootState) => ({
  min: state.filters.minPrice,
  max: state.filters.maxPrice,
});
export const selectSelectedCategories = (state: RootState) =>
  state.filters.selectedCategories;
export const selectMinRating = (state: RootState) => state.filters.minRating;
export const selectInStockOnly = (state: RootState) => state.filters.inStockOnly;
export const selectIsFilterModalOpen = (state: RootState) =>
  state.filters.isFilterModalOpen;
export const selectIsLoading = (state: RootState) => state.filters.isLoading;

// Check if any filters are applied
export const selectHasActiveFilters = (state: RootState) => {
  const filters = state.filters;
  return (
    filters.minPrice > 0 ||
    filters.maxPrice < 100000 ||
    filters.selectedCategories.length > 0 ||
    filters.minRating !== 'none' ||
    filters.inStockOnly ||
    filters.sort !== 'none'
  );
};

// Get count of active filters
export const selectActiveFilterCount = (state: RootState) => {
  let count = 0;
  const filters = state.filters;

  if (filters.minPrice > 0 || filters.maxPrice < 100000) count++;
  if (filters.selectedCategories.length > 0) count += filters.selectedCategories.length;
  if (filters.minRating !== 'none') count++;
  if (filters.inStockOnly) count++;
  if (filters.sort !== 'none') count++;

  return count;
};

export const {
  setSortOption,
  setPriceRange,
  setMinPrice,
  setMaxPrice,
  toggleCategory,
  setCategories,
  setMinRating,
  setInStockOnly,
  openFilterModal,
  closeFilterModal,
  setLoading,
  clearAllFilters,
  resetFiltersKeepSort,
  loadFiltersFromStorage,
} = filterSlice.actions;

export default filterSlice.reducer;
