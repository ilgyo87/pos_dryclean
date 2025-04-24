// src/hooks/useCustomers.ts
import { useState, useCallback, useEffect, useRef } from 'react';
import { Customer } from '../types';
import { getAllCustomers } from '../localdb/services/customerService';

/**
 * Custom hook to safely fetch and manage customer data
 * with proper cleanup to prevent invalidated Results errors
 */
export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Use refs to track component mount state and avoid memory leaks
  const isMountedRef = useRef(true);
  
  // Function to safely fetch customers
  const fetchCustomers = useCallback(async () => {
    if (!isMountedRef.current) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Get all customers from the service - this will return detached objects
      const results = await getAllCustomers();
      
      // Only update state if the component is still mounted
      if (isMountedRef.current) {
        // Since getAllCustomers already returns detached objects, we can use them directly
        // But we'll still do a defensive copy to be extra safe
        const customersCopy = results.map(item => ({
          ...item,
          // Extra defensive copying on critical fields
          _id: String(item._id || ''),
          firstName: String(item.firstName || ''),
          lastName: String(item.lastName || ''),
          phone: String(item.phone || ''),
          notes: Array.isArray(item.notes) ? [...item.notes] : [],
          createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
          updatedAt: item.updatedAt ? new Date(item.updatedAt) : undefined
        }));
        
        setCustomers(customersCopy);
      }
    } catch (err: any) {
      console.error('[useCustomers] Error fetching customers:', err);
      if (isMountedRef.current) {
        setError(err.message || 'Failed to fetch customers');
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);
  
  // Initial data fetch on mount
  useEffect(() => {
    console.log('[useCustomers] Mounting hook');
    isMountedRef.current = true;
    fetchCustomers();
    
    // Cleanup function to run on unmount
    return () => {
      console.log('[useCustomers] Unmounting hook, cleaning up');
      isMountedRef.current = false;
      // Clear customers on unmount to avoid stale refs
      setCustomers([]);
    };
  }, [fetchCustomers]);
  
  // Debug output to track customers state
  useEffect(() => {
    console.log(`[useCustomers] Customers updated: ${customers.length} items`);
  }, [customers]);
  
  return {
    customers,
    isLoading,
    error,
    refetch: fetchCustomers
  };
}