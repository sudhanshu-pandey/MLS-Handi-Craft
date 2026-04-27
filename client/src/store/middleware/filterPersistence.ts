import { Middleware } from '@reduxjs/toolkit';
import { RootState } from '../store';
import { FilterState } from '../slices/filterSlice';

const FILTERS_STORAGE_KEY = 'handi-craft-filters';

/**
 * Middleware to persist filter state to localStorage
 * This ensures filters are maintained across page refreshes
 */
export const filterPersistenceMiddleware: Middleware =
  (store) => (next) => (action: any) => {
    // Call the next middleware/reducer
    const result = next(action);

    // Get updated state after action is processed
    const state = store.getState() as RootState;
    const filterState = state.filters;

    // Persist filters to localStorage (excluding modal states)
    const persistableFilters = {
      sort: filterState.sort,
      minPrice: filterState.minPrice,
      maxPrice: filterState.maxPrice,
      selectedCategories: filterState.selectedCategories,
      minRating: filterState.minRating,
      inStockOnly: filterState.inStockOnly,
    };

    try {
      localStorage.setItem(
        FILTERS_STORAGE_KEY,
        JSON.stringify(persistableFilters)
      );
    } catch (error) {
      console.error('Failed to persist filters to localStorage:', error);
    }

    return result;
  };

/**
 * Load filters from localStorage
 * Call this on app initialization
 */
export const loadFiltersFromStorage = () => {
  try {
    const stored = localStorage.getItem(FILTERS_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as Partial<FilterState>;
    }
  } catch (error) {
    console.error('Failed to load filters from localStorage:', error);
  }
  return null;
};

/**
 * Clear saved filters from localStorage
 */
export const clearPersistedFilters = () => {
  try {
    localStorage.removeItem(FILTERS_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear filters from localStorage:', error);
  }
};
