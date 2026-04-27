import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  selectFilterState,
  setPriceRange,
  toggleCategory,
  setMinRating,
  setInStockOnly,
  clearAllFilters,
  setSortOption,
} from '../../store/slices/filterSlice';
import styles from './FilterSidebar.module.css';

interface FilterSidebarProps {
  categories: string[];
}

const RATING_OPTIONS: Array<{ label: string; value: 4 | 4.5 | 5 }> = [
  { label: '4★ & Above', value: 4 },
  { label: '4.5★ & Above', value: 4.5 },
  { label: '5★ Only', value: 5 },
];

const SORT_OPTIONS = [
  { label: 'Newest First', value: 'newest' },
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Price: High to Low', value: 'price_desc' },
  { label: 'Most Popular', value: 'popularity' },
];

export const FilterSidebar: React.FC<FilterSidebarProps> = ({ categories }) => {
  const dispatch = useAppDispatch();
  const filters = useAppSelector(selectFilterState);
  const [localMinPrice, setLocalMinPrice] = useState(filters.minPrice);
  const [localMaxPrice, setLocalMaxPrice] = useState(filters.maxPrice);

  const handlePriceChange = () => {
    if (localMinPrice <= localMaxPrice) {
      dispatch(setPriceRange({ min: localMinPrice, max: localMaxPrice }));
    }
  };

  const handleCategoryToggle = (category: string) => {
    dispatch(toggleCategory(category));
  };

  const handleRatingChange = (rating: 4 | 4.5 | 5) => {
    dispatch(setMinRating(filters.minRating === rating ? 'none' : rating));
  };

  const handleStockToggle = () => {
    dispatch(setInStockOnly(!filters.inStockOnly));
  };

  const handleSortChange = (sortValue: string) => {
    dispatch(setSortOption(sortValue as any));
  };

  const handleClearAll = () => {
    dispatch(clearAllFilters());
    setLocalMinPrice(0);
    setLocalMaxPrice(100000);
  };

  return (
    <div className={styles.sidebar}>
      <div className={styles.header}>
        <h2>Filters</h2>
      </div>

      <div className={styles.sections}>
        {/* Sort Section */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Sort By</h3>
          <div className={styles.sortGroup}>
            {SORT_OPTIONS.map((option) => (
              <label key={option.value} className={styles.radioLabel}>
                <input
                  type="radio"
                  name="sort"
                  value={option.value}
                  checked={filters.sort === option.value}
                  onChange={() => handleSortChange(option.value)}
                  className={styles.radio}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Price Range Filter */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Price Range</h3>
          <div className={styles.priceInputs}>
            <div className={styles.priceInput}>
              <label>Min</label>
              <input
                type="number"
                value={localMinPrice}
                onChange={(e) => setLocalMinPrice(Math.max(0, parseInt(e.target.value) || 0))}
                onBlur={handlePriceChange}
                min="0"
                placeholder="₹0"
                className={styles.input}
              />
            </div>
            <div className={styles.priceInput}>
              <label>Max</label>
              <input
                type="number"
                value={localMaxPrice}
                onChange={(e) => setLocalMaxPrice(Math.max(0, parseInt(e.target.value) || 0))}
                onBlur={handlePriceChange}
                min="0"
                placeholder="₹100000"
                className={styles.input}
              />
            </div>
          </div>
          <div className={styles.priceDisplay}>
            ₹{localMinPrice.toLocaleString()} - ₹{localMaxPrice.toLocaleString()}
          </div>
        </div>

        {/* Category Filter */}
        {categories.length > 0 && (
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Category</h3>
            <div className={styles.checkboxGroup}>
              {categories.map((category) => (
                <label key={category} className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={filters.selectedCategories.includes(category)}
                    onChange={() => handleCategoryToggle(category)}
                    className={styles.checkbox}
                  />
                  <span>{category}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Rating Filter */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Rating</h3>
          <div className={styles.checkboxGroup}>
            {RATING_OPTIONS.map((option) => (
              <label key={option.value} className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={filters.minRating === option.value}
                  onChange={() => handleRatingChange(option.value)}
                  className={styles.checkbox}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Availability Filter */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Availability</h3>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={filters.inStockOnly}
              onChange={handleStockToggle}
              className={styles.checkbox}
            />
            <span>In Stock Only</span>
          </label>
        </div>
      </div>

      {/* Footer */}
      <div className={styles.footer}>
        <button className={styles.clearBtn} onClick={handleClearAll}>
          Clear All Filters
        </button>
      </div>
    </div>
  );
};

export default FilterSidebar;
