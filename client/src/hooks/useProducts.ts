/**
 * useProducts Hook
 * Production-grade hook for product operations
 * Handles fetching, caching, and state management
 */

import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  fetchProducts,
  fetchProductsByCategory,
  fetchProductById,
  clearError,
  resetProducts,
  type Product,
} from '../store/slices/productSlice';

export const useProducts = () => {
  const dispatch = useAppDispatch();
  const {
    items,
    allProducts,
    loading,
    error,
    totalProducts,
    currentPage,
    totalPages,
  } = useAppSelector((state) => state.products);

  /**
   * Load all products from backend
   */
  const loadProducts = useCallback(
    async (page = 1, limit = 20) => {
      try {
        await dispatch(fetchProducts({ page, limit })).unwrap();
      } catch (err) {
        console.error('❌ Failed to load products:', err);
      }
    },
    [dispatch]
  );

  /**
   * Load products by category
   */
  const loadProductsByCategory = useCallback(
    async (category: string) => {
      try {
        await dispatch(fetchProductsByCategory(category)).unwrap();
      } catch (err) {
        console.error('❌ Failed to load products by category:', err);
      }
    },
    [dispatch]
  );

  /**
   * Load single product by ID
   */
  const loadProductById = useCallback(
    async (productId: string | number) => {
      try {
        await dispatch(fetchProductById(productId)).unwrap();
      } catch (err) {
        console.error('❌ Failed to load product:', err);
      }
    },
    [dispatch]
  );

  /**
   * Get first N products (for home page)
   */
  const getFirstProducts = useCallback(
    (count: number = 6): Product[] => {
      return allProducts.slice(0, count);
    },
    [allProducts]
  );

  /**
   * Get all products
   */
  const getAllProducts = useCallback((): Product[] => {
    return allProducts;
  }, [allProducts]);

  /**
   * Get product by ID from local state
   */
  const getProductById = useCallback(
    (productId: string | number): Product | undefined => {
      // Direct match by _id or id
      let found = allProducts.find(
        (p: Product) => p._id === productId || p.id === productId
      );
      
      if (found) return found;
      
      // String comparison fallback for mixed ID types
      const productIdStr = String(productId);
      found = allProducts.find(
        (p: Product) => String(p._id) === productIdStr || String(p.id) === productIdStr
      );
      
      return found;
    },
    [allProducts]
  );

  /**
   * Get products by category from local state
   */
  const getProductsByCategory = useCallback(
    (category: string): Product[] => {
      return allProducts.filter(
        (p: Product) => p.category?.toLowerCase() === category.toLowerCase()
      );
    },
    [allProducts]
  );

  /**
   * Clear error message
   */
  const handleClearError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  /**
   * Reset products state
   */
  const handleResetProducts = useCallback(() => {
    dispatch(resetProducts());
  }, [dispatch]);

  return {
    // State
    products: items,
    allProducts,
    loading,
    error,
    totalProducts,
    currentPage,
    totalPages,

    // Actions
    loadProducts,
    loadProductsByCategory,
    loadProductById,
    getFirstProducts,
    getAllProducts,
    getProductById,
    getProductsByCategory,
    clearError: handleClearError,
    resetProducts: handleResetProducts,
  };
};

export default useProducts;
