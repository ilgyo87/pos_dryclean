import { useState, useEffect, useCallback, useRef } from 'react';
import { UsePredictiveSearchProps, UsePredictiveSearchResult } from './types';

/**
 * Custom hook for predictive search functionality
 */
export function usePredictiveSearch<T extends Record<string, any>>({
  items,
  onSelect,
  searchKeys = ['name' as keyof T],
  debounceTime = 300,
  maxResults = 20,
}: UsePredictiveSearchProps<T>): UsePredictiveSearchResult<T> {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [filteredItems, setFilteredItems] = useState<T[]>([]);
  const [showResults, setShowResults] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle text input changes with debounce
  const handleChangeText = useCallback((text: string) => {
    setQuery(text);

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set a new timeout for debouncing
    timeoutRef.current = setTimeout(() => {
      setDebouncedQuery(text);
    }, debounceTime);
  }, [debounceTime]);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Filter items based on debounced query
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setFilteredItems([]);
      return;
    }

    const normalizedQuery = debouncedQuery.toLowerCase().trim();

    const filtered = items
      .filter(item => {
        // Search through all specified keys
        return searchKeys.some(key => {
          const value = item[key];

          // Handle different value types
          if (typeof value === 'string') {
            return value.toLowerCase().includes(normalizedQuery);
          } else if (typeof value === 'number') {
            return value.toString().includes(normalizedQuery);
          }

          return false;
        });
      })
      .slice(0, maxResults); // Limit results to maxResults

    setFilteredItems(filtered);
  }, [debouncedQuery, items, searchKeys, maxResults]);

  // Handle focus and blur events
  const handleFocus = useCallback(() => {
    setShowResults(true);
  }, []);

  const handleBlur = useCallback(() => {
    // Use a timeout to allow click events on results to fire before hiding
    setTimeout(() => {
      setShowResults(false);
    }, 200);
  }, []);

  // Handle item selection
  const handleSelect = useCallback((item: T) => {
    onSelect(item);
    // Get display value from first available searchKey
    for (const key of searchKeys) {
      if (item[key] && typeof item[key] === 'string') {
        setQuery(item[key] as string);
        break;
      }
    }
    setShowResults(false);
  }, [onSelect, searchKeys]);

  return {
    query,
    filteredItems,
    showResults,
    handleChangeText,
    handleFocus,
    handleBlur,
    handleSelect,
  };
}