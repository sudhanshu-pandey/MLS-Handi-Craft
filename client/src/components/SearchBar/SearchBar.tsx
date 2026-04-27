import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import productService from '../../services/product.service'
import styles from './SearchBar.module.css'

interface Product {
  _id: string | number
  id?: string | number
  name: string
  price: number
  image?: string
  images?: string[]
  description?: string
  category?: string
}

interface SearchBarProps {
  isOpen?: boolean
  onClose?: () => void
  maxResults?: number
}

/**
 * SearchBar Component
 * Real-time product search with dropdown suggestions
 * - Debounced search (300ms)
 * - Minimum 2-3 characters required
 * - Shows up to 5-10 results
 * - Click outside or select item to close
 * - Highlight matched text in product names
 */
const SearchBar: React.FC<SearchBarProps> = ({ isOpen = false, onClose, maxResults = 8 }) => {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [suggestions, setSuggestions] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Debounce the search query
  const debouncedQuery = useDebouncedValue(searchQuery, 300)

  // Fetch suggestions when debounced query changes
  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setSuggestions([])
      setIsDropdownOpen(false)
      setSelectedIndex(-1)
      return
    }

    const fetchSuggestions = async () => {
      try {
        setIsLoading(true)
        const results = await productService.searchProducts(debouncedQuery)
        
        // Limit results to maxResults
        const limitedResults = Array.isArray(results) ? results.slice(0, maxResults) : []
        setSuggestions(limitedResults)
        // Show dropdown even if no results found (to display "no products found" message)
        setIsDropdownOpen(true)
        setSelectedIndex(-1)
      } catch (error) {
        console.error('Search error:', error)
        setSuggestions([])
        setIsDropdownOpen(true)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSuggestions()
  }, [debouncedQuery, maxResults])

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(target) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(target)
      ) {
        setIsDropdownOpen(false)
      }
    }

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleOutsideClick)
      return () => document.removeEventListener('mousedown', handleOutsideClick)
    }
  }, [isDropdownOpen])

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isDropdownOpen && e.key !== 'Enter') return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1))
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          handleSelectProduct(suggestions[selectedIndex])
        } else if (searchQuery.length >= 2) {
          // Navigate to products page with search query
          navigate(`/products?search=${encodeURIComponent(searchQuery)}`)
          handleClose()
        }
        break
      case 'Escape':
        e.preventDefault()
        handleClose()
        break
      default:
        break
    }
  }

  // Navigate to product detail page
  const handleSelectProduct = useCallback(
    (product: Product) => {
      const productId = product._id || product.id
      navigate(`/products/${productId}`)
      handleClose()
    },
    [navigate]
  )

  const handleClose = useCallback(() => {
    setSearchQuery('')
    setSuggestions([])
    setIsDropdownOpen(false)
    setSelectedIndex(-1)
    onClose?.()
  }, [onClose])

  // Highlight matching text in product name
  const highlightMatch = (text: string, query: string) => {
    if (!query) return text
    
    const parts = text.split(new RegExp(`(${query})`, 'gi'))
    return parts.map((part, index) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <span key={index} className={styles.highlight}>
          {part}
        </span>
      ) : (
        part
      )
    )
  }

  // Get product image
  const getProductImage = (product: Product): string => {
    if (product.image) return product.image
    if (product.images && product.images.length > 0) return product.images[0]
    return '/images/products/placeholder.svg'
  }

  return (
    <div className={`${styles.searchBarContainer} ${isOpen ? styles.active : ''}`.trim()}>
      <div className={styles.searchInputWrapper}>
        <input
          ref={searchInputRef}
          type="text"
          className={styles.searchInput}
          placeholder="Search products... (min 2 characters)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) {
              setIsDropdownOpen(true)
            }
          }}
          aria-label="Search products"
          aria-expanded={isDropdownOpen}
          aria-controls="search-suggestions"
        />
        {searchQuery && (
          <button
            className={styles.clearBtn}
            onClick={handleClose}
            aria-label="Clear search"
            title="Clear search"
          >
            ✕
          </button>
        )}
        {isLoading && <span className={styles.loadingIndicator}>⟳</span>}
      </div>

      {/* Suggestions Dropdown */}
      {isDropdownOpen && (
        <div
          ref={dropdownRef}
          className={styles.suggestionsDropdown}
          id="search-suggestions"
          role="listbox"
        >
          {suggestions.length > 0 ? (
            <ul className={styles.suggestionsList}>
              {suggestions.map((product, index) => (
                <li
                  key={`${product._id}-${index}`}
                  className={`${styles.suggestionItem} ${
                    index === selectedIndex ? styles.selected : ''
                  }`.trim()}
                  role="option"
                  aria-selected={index === selectedIndex}
                  onClick={() => handleSelectProduct(product)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <div className={styles.productThumbnail}>
                    <img
                      src={getProductImage(product)}
                      alt={product.name}
                      loading="lazy"
                    />
                  </div>

                  <div className={styles.productInfo}>
                    <h4 className={styles.productName}>
                      {highlightMatch(product.name, searchQuery)}
                    </h4>
                    {product.description && (
                      <p className={styles.productDescription}>
                        {product.description.substring(0, 60)}...
                      </p>
                    )}
                    <div className={styles.productMeta}>
                      <span className={styles.price}>
                        ₹{product.price.toLocaleString('en-IN')}
                      </span>
                      {product.category && (
                        <span className={styles.category}>{product.category}</span>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className={styles.noResults}>
              <p>No products found for "{searchQuery}"</p>
              <small>Try searching with different keywords</small>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default SearchBar
