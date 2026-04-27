import { useEffect, useState, useMemo } from 'react'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import ProductCard from '../components/ProductCard/ProductCard'
import FilterSidebar from '../components/FilterSidebar/FilterSidebar'
import FilterModal from '../components/FilterModal/FilterModal'
import FilterChips from '../components/FilterChips/FilterChips'
import useProducts from '../hooks/useProducts'
import {
  selectFilterState,
  openFilterModal,
  selectHasActiveFilters,
  selectActiveFilterCount,
} from '../store/slices/filterSlice'
import { applyFiltersAndSort, getUniqueCategoriesFromProducts } from '../utils/filterUtils'
import styles from './pages.module.css'
import './Products.css'

const Products = () => {
  const dispatch = useAppDispatch()
  const { loadProducts, allProducts, loading, error } = useProducts()
  const filters = useAppSelector(selectFilterState)
  const hasActiveFilters = useAppSelector(selectHasActiveFilters)
  const activeFilterCount = useAppSelector(selectActiveFilterCount)
  
  const [currentPage, setCurrentPage] = useState(1)
  const productsPerPage = 15

  // Fetch all products on component mount
  useEffect(() => {
    loadProducts(1, 100)
  }, [loadProducts])

  // Get unique categories for filter modal
  const categories = useMemo(
    () => getUniqueCategoriesFromProducts(allProducts),
    [allProducts]
  )

  // Apply filters and sorting
  const filteredProducts = useMemo(
    () => applyFiltersAndSort(allProducts, filters),
    [allProducts, filters]
  )

  // Calculate pagination based on filtered products
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage)
  const indexOfLastProduct = currentPage * productsPerPage
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage
  const currentProducts = filteredProducts.slice(
    indexOfFirstProduct,
    indexOfLastProduct
  )

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [filters])

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handlePageClick = (pageNumber: number) => {
    setCurrentPage(pageNumber)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className={styles.productsContainer}>
      <h1 className={styles.pageTitle}>Our Products</h1>

      {error && (
        <div className="errorBox">
          ❌ Failed to load products: {error}
        </div>
      )}

      {loading ? (
        <div className="loadingBox">
          ⏳ Loading products...
        </div>
      ) : (
        <>
          {/* Main Layout Container - Desktop: Filter sidebar + Products, Mobile: Full width */}
          <div className={styles.productsLayout}>
            {/* Left Sidebar - Desktop Only */}
            <div className="desktopFilters">
              <FilterSidebar categories={categories} />
            </div>

            {/* Right Column - Products Section */}
            <div>
              {/* Mobile Filter Button - Hidden on Desktop */}
              <div className="mobileFiltersButton">
                <button
                  className="filterButton"
                  onClick={() => dispatch(openFilterModal())}
                >
                  <span>🔍 Filters</span>
                  {hasActiveFilters && (
                    <span className="filterCountBadge">
                      {activeFilterCount}
                    </span>
                  )}
                </button>
              </div>

              {/* Active Filters Display */}
              {hasActiveFilters && <FilterChips />}

              {/* Products Grid or No Results */}
              {filteredProducts.length === 0 ? (
                <div className="noResultsContainer">
                  <div className="noResultsIcon">🔍</div>
                  <h3 className="noResultsTitle">
                    No Products Found
                  </h3>
                  <p className="noResultsDescription">
                    Try adjusting your filters or sorting options
                  </p>
                </div>
              ) : (
                <>
                  <div className={styles.productsGrid}>
                    {currentProducts.map((product: any) => (
                      <ProductCard
                        key={product._id || product.id}
                        product={{
                          id: product.id,
                          _id: product._id,
                          name: product.name,
                          price: product.price,
                          originalPrice: product.originalPrice,
                          image: product.image,
                          category: product.category,
                          sale: product.sale,
                          stock: product.stock,
                          rating: product.rating,
                          reviewCount: product.reviewCount,
                        }}
                      />
                    ))}
                  </div>

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="paginationContainer">
                      <button
                        onClick={handlePrevPage}
                        disabled={currentPage === 1}
                        className={`paginationButton ${currentPage === 1 ? 'disabled' : ''}`}
                      >
                        ← Previous
                      </button>

                      <div className="paginationNumbers">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                          (pageNumber) => (
                            <button
                              key={pageNumber}
                              onClick={() => handlePageClick(pageNumber)}
                              className={`paginationButton ${currentPage === pageNumber ? 'active' : ''}`}
                            >
                              {pageNumber}
                            </button>
                          )
                        )}
                      </div>

                      <button
                        onClick={handleNextPage}
                        disabled={currentPage === totalPages}
                        className={`paginationButton ${currentPage === totalPages ? 'disabled' : ''}`}
                      >
                        Next →
                      </button>
                    </div>
                  )}

                  <p className="paginationInfo">
                    Showing {indexOfFirstProduct + 1} to{' '}
                    {Math.min(indexOfLastProduct, filteredProducts.length)} of{' '}
                    {filteredProducts.length} products
                  </p>
                </>
              )}
            </div>
          </div>
        </>
      )}

      {/* Filter Modal - Mobile Only */}
      {filters.isFilterModalOpen && (
        <FilterModal categories={categories} />
      )}
    </div>
  )
}

export default Products
