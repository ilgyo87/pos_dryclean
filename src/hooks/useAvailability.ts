import { useState, useEffect, useRef } from 'react';

/**
 * Generic hook for checking availability of a value via custom async checker.
 * @param value The value to check (e.g., phone, email).
 * @param checkFn Async function that returns true if the value exists/is used.
 * @returns Object with available (boolean), loading (boolean), and error (string | null)
 */
export function useAvailability(
  value: string,
  checkFn: (val: string) => Promise<boolean>
) {
  const [available, setAvailable] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastCheckedValue, setLastCheckedValue] = useState<string>('');

  // Store latest checkFn in ref to avoid re-running effect when its identity changes
  const checkRef = useRef(checkFn);
  useEffect(() => { 
    checkRef.current = checkFn; 
  }, [checkFn]);

  // Debounce timer reference
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clear existing timer if value changes
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    // If no value, mark as available and reset
    if (!value) {
      setAvailable(true);
      setLoading(false);
      setError(null);
      return;
    }

    // Skip check if value hasn't changed since last successful check
    if (value === lastCheckedValue) {
      return;
    }

    // Set loading state
    setLoading(true);
    setError(null);

    // Use a ref to track if component is still mounted
    const activeRef = useRef(true);
    
    // Debounce the check (300ms)
    debounceTimerRef.current = setTimeout(async () => {
      try {
        // Run availability check
        const exists = await checkRef.current(value);
        
        if (activeRef.current) {
          setAvailable(!exists); // If exists=true, then available=false
          setLastCheckedValue(value); // Store the value we just checked
        }
      } catch (e: any) {
        if (activeRef.current) {
          console.error('Error checking availability:', e);
          setError(e.message || 'Error checking availability');
          setAvailable(false); // Fail safe: consider unavailable on error
        }
      } finally {
        if (activeRef.current) {
          setLoading(false);
        }
      }
    }, 300);

    // Cleanup on unmount or when value changes
    return () => {
      activeRef.current = false;
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
    };
  }, [value, lastCheckedValue]);

  return { available, loading, error };
}