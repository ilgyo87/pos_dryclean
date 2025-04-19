import { useState, useEffect, useRef } from 'react';

/**
 * Generic hook for checking availability of a value via custom async checker.
 * @param value The value to check (e.g., phone, email).
 * @param checkFn Async function that returns true if the value exists/is used.
 */
export function useAvailability(
  value: string,
  checkFn: (val: string) => Promise<boolean>
) {
  const [available, setAvailable] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Store latest checkFn in ref to avoid re-running effect when its identity changes
  const checkRef = useRef(checkFn);
  useEffect(() => { checkRef.current = checkFn; }, [checkFn]);

  useEffect(() => {
    let active = true;
    if (!value) {
      setAvailable(true);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    // Run availability check
    checkRef.current(value)
      .then((exists) => {
        if (active) setAvailable(!exists);
      })
      .catch((e: any) => {
        if (active) setError(e.message || 'Error checking availability');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [value]);

  return { available, loading, error };
}
