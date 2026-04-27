import React from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  selectFilterState,
  selectActiveFilterCount,
  toggleCategory,
  setMinRating,
  setInStockOnly,
  setPriceRange,
  setSortOption,
  clearAllFilters,
} from '../../store/slices/filterSlice';
import styles from './FilterChips.module.css';

export const FilterChips: React.FC = () => {
  const dispatch = useAppDispatch();
  const filters = useAppSelector(selectFilterState);
  const activeFilterCount = useAppSelector(selectActiveFilterCount);

  if (activeFilterCount === 0) {
    return null;
  }

  const handleRemovePriceFilter = () => {
    dispatch(setPriceRange({ min: 0, max: 100000 }));
  };

  const handleRemoveCategory = (category: string) => {
    dispatch(toggleCategory(category));
  };

  const handleRemoveRating = () => {
    dispatch(setMinRating('none'));
  };

  const handleRemoveStock = () => {
    dispatch(setInStockOnly(false));
  };

  const handleRemoveSort = () => {
    dispatch(setSortOption('none'));
  };

  const handleClearAll = () => {
    dispatch(clearAllFilters());
  };

  const getSortLabel = () => {
    const sortMap: Record<string, string> = {
      price_asc: 'Price: Low to High',
      price_desc: 'Price: High to Low',
      newest: 'Newest',
      popularity: 'Popular',
    };
    return sortMap[filters.sort] || null;
  };

  return (
    <div className={styles.container}>
      <div className={styles.chipsWrapper}>
        {/* Price Range Chip */}
        {(filters.minPrice > 0 || filters.maxPrice < 100000) && (
          <div className={styles.chip}>
            <span className={styles.label}>
              ₹{filters.minPrice.toLocaleString()} - ₹{filters.maxPrice.toLocaleString()}
            </span>
            <button
              className={styles.removeBtn}
              onClick={handleRemovePriceFilter}
              aria-label="Remove price filter"
            >
              ✕
            </button>
          </div>
        )}

        {/* Category Chips */}
        {filters.selectedCategories.map((category: string) => (
          <div key={category} className={styles.chip}>
            <span className={styles.label}>{category}</span>
            <button
              className={styles.removeBtn}
              onClick={() => handleRemoveCategory(category)}
              aria-label={`Remove ${category} filter`}
            >
              ✕
            </button>
          </div>
        ))}

        {/* Rating Chip */}
        {filters.minRating !== 'none' && (
          <div className={styles.chip}>
            <span className={styles.label}>{filters.minRating}★ & Above</span>
            <button
              className={styles.removeBtn}
              onClick={handleRemoveRating}
              aria-label="Remove rating filter"
            >
              ✕
            </button>
          </div>
        )}

        {/* In Stock Only Chip */}
        {filters.inStockOnly && (
          <div className={styles.chip}>
            <span className={styles.label}>In Stock</span>
            <button
              className={styles.removeBtn}
              onClick={handleRemoveStock}
              aria-label="Remove stock filter"
            >
              ✕
            </button>
          </div>
        )}

        {/* Sort Chip */}
        {filters.sort !== 'none' && getSortLabel() && (
          <div className={styles.chip}>
            <span className={styles.label}>Sort: {getSortLabel()}</span>
            <button
              className={styles.removeBtn}
              onClick={handleRemoveSort}
              aria-label="Remove sort"
            >
              ✕
            </button>
          </div>
        )}

        {/* Clear All Button */}
        {activeFilterCount > 0 && (
          <button className={styles.clearAllBtn} onClick={handleClearAll}>
            Clear All
          </button>
        )}
      </div>
    </div>
  );
};

export default FilterChips;
