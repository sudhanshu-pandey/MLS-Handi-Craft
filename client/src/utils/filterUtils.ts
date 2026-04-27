import { Product } from '../store/slices/productSlice';
import { FilterState, SortOption } from '../store/slices/filterSlice';

/**
 * Apply filters and sorting to products
 * @param products - Array of products to filter/sort
 * @param filters - Current filter state
 * @returns Filtered and sorted products array
 */
export const applyFiltersAndSort = (
  products: Product[],
  filters: FilterState
): Product[] => {
  let result = [...products];

  // Apply filters
  result = applyFilters(result, filters);

  // Apply sorting
  result = applySorting(result, filters.sort);

  return result;
};

/**
 * Apply filter criteria to products
 */
export const applyFilters = (products: Product[], filters: FilterState): Product[] => {
  return products.filter((product) => {
    // Price filter
    if (
      product.price < filters.minPrice ||
      product.price > filters.maxPrice
    ) {
      return false;
    }

    // Category filter
    if (
      filters.selectedCategories.length > 0 &&
      !filters.selectedCategories.includes(product.category)
    ) {
      return false;
    }

    // Rating filter
    if (filters.minRating !== 'none') {
      if (!product.rating || product.rating < filters.minRating) {
        return false;
      }
    }

    // Stock filter
    if (filters.inStockOnly) {
      if (product.stock === undefined || product.stock <= 0) {
        return false;
      }
    }

    return true;
  });
};

/**
 * Apply sorting to products
 */
export const applySorting = (
  products: Product[],
  sortOption: SortOption
): Product[] => {
  const result = [...products];

  switch (sortOption) {
    case 'price_asc':
      return result.sort((a, b) => a.price - b.price);

    case 'price_desc':
      return result.sort((a, b) => b.price - a.price);

    case 'newest':
      return result.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
      });

    case 'popularity':
      return result.sort((a, b) => {
        const aScore = (a.reviewCount || 0) * (a.rating || 0);
        const bScore = (b.reviewCount || 0) * (b.rating || 0);
        return bScore - aScore;
      });

    case 'none':
    default:
      return result;
  }
};

/**
 * Get unique categories from products
 */
export const getUniqueCategoriesFromProducts = (products: Product[]): string[] => {
  const categories = new Set(products.map((p) => p.category));
  return Array.from(categories).sort();
};

/**
 * Build query params for API requests
 */
export const buildFilterQueryParams = (filters: FilterState): URLSearchParams => {
  const params = new URLSearchParams();

  if (filters.sort !== 'none') {
    params.append('sort', filters.sort);
  }

  if (filters.minPrice > 0) {
    params.append('minPrice', String(filters.minPrice));
  }

  if (filters.maxPrice < 100000) {
    params.append('maxPrice', String(filters.maxPrice));
  }

  if (filters.selectedCategories.length > 0) {
    params.append('category', filters.selectedCategories.join(','));
  }

  if (filters.minRating !== 'none') {
    params.append('minRating', String(filters.minRating));
  }

  if (filters.inStockOnly) {
    params.append('inStock', 'true');
  }

  return params;
};
