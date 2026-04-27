/**
 * useSearch Hook
 * Custom hook for managing product search functionality
 * Handles debounced search, suggestions fetching, and state management
 */

import { useCallback, useEffect, useState } from 'react'
import { useDebouncedValue } from './useDebouncedValue'
import productService from '../services/product.service'

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

interface UseSearchOptions {
  debounceDelay?: number
  minChars?: number
  maxResults?: number
}

export const useSearch = (options: UseSearchOptions = {}) => {
  const { debounceDelay = 300, minChars = 2, maxResults = 8 } = options

  const [searchQuery, setSearchQuery] = useState('')
  const [suggestions, setSuggestions] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [isOpen, setIsOpen] = useState(false)

  // Debounce the search query
  const debouncedQuery = useDebouncedValue(searchQuery, debounceDelay)

  // Fetch suggestions when debounced query changes
  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < minChars) {
      setSuggestions([])
      setIsOpen(false)
      setError(null)
      return
    }

    const fetchSuggestions = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const results = await productService.searchProducts(debouncedQuery)

        // Limit results to maxResults
        const limitedResults = Array.isArray(results) ? results.slice(0, maxResults) : []
        setSuggestions(limitedResults)
        setIsOpen(limitedResults.length > 0)
        setSelectedIndex(-1)
      } catch (err) {
        console.error('Search error:', err)
        setError(err instanceof Error ? err.message : 'Search failed')
        setSuggestions([])
        setIsOpen(false)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSuggestions()
  }, [debouncedQuery, minChars, maxResults])

  // Reset search
  const resetSearch = useCallback(() => {
    setSearchQuery('')
    setSuggestions([])
    setIsOpen(false)
    setSelectedIndex(-1)
    setError(null)
  }, [])

  // Select suggestion by index
  const selectSuggestion = useCallback((index: number) => {
    if (index >= 0 && index < suggestions.length) {
      return suggestions[index]
    }
    return null
  }, [suggestions])

  // Navigate to next suggestion
  const nextSuggestion = useCallback(() => {
    setSelectedIndex((prev) => {
      if (prev < suggestions.length - 1) {
        return prev + 1
      }
      return prev
    })
  }, [suggestions.length])

  // Navigate to previous suggestion
  const prevSuggestion = useCallback(() => {
    setSelectedIndex((prev) => {
      if (prev > 0) {
        return prev - 1
      }
      return -1
    })
  }, [])

  return {
    searchQuery,
    setSearchQuery,
    suggestions,
    isLoading,
    error,
    selectedIndex,
    setSelectedIndex,
    isOpen,
    setIsOpen,
    resetSearch,
    selectSuggestion,
    nextSuggestion,
    prevSuggestion,
  }
}
