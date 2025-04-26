// src/hooks/useBusiness.ts - createBusiness function
import { useState, useEffect, useRef, useCallback } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { AuthUser } from 'aws-amplify/auth';

// Create a data client
const client = generateClient<Schema>();

// Global state to track if business data needs to be refetched
let needsRefetch = true; 

// Function to reset the global refetch state
export const resetBusinessRefetchState = () => {
  console.log('[useBusiness] Resetting global refetch state');
  needsRefetch = true;
};

interface BusinessHookProps {
  userId?: string;
  refresh?: number;
  authUser?: AuthUser;
  forceRefreshOnMount?: boolean;
}

export const useBusiness = ({ 
  userId, 
  refresh = 0, 
  authUser,
  forceRefreshOnMount = false 
}: BusinessHookProps) => {
  const [business, setBusiness] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef<boolean>(false);
  const hasInitialFetchedRef = useRef<boolean>(false);
  const currentRefreshRef = useRef<number>(refresh);
  const fetchTimeoutRef = useRef<any>(null);

  // Fetch business data
  const fetchBusiness = useCallback(async (force: boolean = false) => {
    // Skip if not mounted or no user ID
    if (!isMountedRef.current || !userId) {
      console.log(`[useBusiness] Skipping fetch - ${!isMountedRef.current ? 'component not mounted' : 'no userId'}`);
      return;
    }

    // Skip if we've already fetched and don't need to refetch
    if (hasInitialFetchedRef.current && !force && !needsRefetch && currentRefreshRef.current === refresh) {
      console.log('[useBusiness] Skipping fetch - no need to refetch');
      return;
    }

    try {
      console.log('[useBusiness] Fetching business data for userId:', userId);
      if (isMountedRef.current) setIsLoading(true);
      if (isMountedRef.current) setError(null);
      
      const response = await client.models.Business.list({
        filter: { userId: { eq: userId } }
      });
      
      console.log(`[useBusiness] API returned ${response.data?.length || 0} businesses`);
      
      if (isMountedRef.current) {
        if (response.data && response.data.length > 0) {
          setBusiness(response.data[0]);
        } else {
          console.log('[useBusiness] No businesses found in API for userId:', userId);
          setBusiness(null);
        }
        // Important: Always set loading to false even when no business is found
        setIsLoading(false);
      }
      
      // Update our tracking refs
      hasInitialFetchedRef.current = true;
      currentRefreshRef.current = refresh;
      needsRefetch = false;
    } catch (err: any) {
      console.error('[useBusiness] Error fetching business:', err);
      if (isMountedRef.current) {
        setError(err.message || 'Failed to fetch business data');
        // Important: Set loading to false even on error
        setIsLoading(false);
        setBusiness(null);
      }
    }
  }, [userId, refresh]);

  // Create a new business - UPDATED
  const createBusiness = useCallback(async (data: any) => {
    if (!userId) {
      throw new Error('User ID is required to create a business');
    }

    try {
      setIsLoading(true);
      setError(null);
      
      console.log('[useBusiness] Creating business with data:', {
        businessName: data.businessName,
        email: data.email,
        phone: data.phone,
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        userId
      });
      
      // Create the business with explicit fields
      const createResponse = await client.models.Business.create({
        businessName: data.businessName,
        email: data.email,
        phone: data.phone,
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        userId
      });
      
      console.log('[useBusiness] Business creation response:', createResponse);
      
      // Check for errors in the response
      if (createResponse.errors && createResponse.errors.length > 0) {
        console.error('[useBusiness] Error in business creation response:', createResponse.errors);
        throw new Error(createResponse.errors[0].message || 'Failed to create business');
      }
      
      // Set business data as soon as it's created if we have data
      if (createResponse.data) {
        setBusiness(createResponse.data);
      }
      
      needsRefetch = true;
      
      // Set isLoading to false after a successful creation
      setIsLoading(false);
      
      return createResponse;
    } catch (err: any) {
      console.error('[useBusiness] Error creating business:', err);
      setError(err.message || 'Failed to create business');
      // Important: Set loading to false even on error
      setIsLoading(false);
      // Rethrow the error so callers can handle it
      throw err;
    }
  }, [userId]);

  // Force a refetch of business data
  const refetch = useCallback((force: boolean = true) => {
    console.log('[useBusiness] Refetch called with force =', force);
    
    // Clear any pending timeout
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }
    
    // Set the refetch flag if force is true
    if (force) {
      needsRefetch = true;
    }
    
    // Do the fetch - use a small timeout to ensure state updates have completed
    fetchTimeoutRef.current = setTimeout(() => {
      fetchBusiness(force);
    }, 50);
  }, [fetchBusiness]);

  // Set mounted state on mount/unmount
  useEffect(() => {
    isMountedRef.current = true;
    
    // If forceRefreshOnMount is true, force a refetch
    if (forceRefreshOnMount) {
      needsRefetch = true;
    }
    
    console.log('[useBusiness] Component mounted, forceRefresh =', forceRefreshOnMount);
    
    return () => {
      console.log('[useBusiness] Component unmounted');
      isMountedRef.current = false;
      
      // Clear any pending timeout on unmount
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
      
      // Ensure loading is never stuck on unmount
      setIsLoading(false);
    };
  }, [forceRefreshOnMount]);

  // Fetch on mount and when dependencies change
  useEffect(() => {
    if (userId) {
      console.log('[useBusiness] UserId changed or mount, fetching business data');
      
      // If we don't have a business yet, set a short timeout to avoid race conditions
      if (!business) {
        fetchTimeoutRef.current = setTimeout(() => {
          fetchBusiness();
        }, 10);
      } else {
        fetchBusiness();
      }
    } else {
      // If no userId, immediately set business to null and isLoading to false
      console.log('[useBusiness] No userId, setting business to null');
      setBusiness(null);
      setIsLoading(false);
    }
    
    // Cleanup timeout on dependency change
    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, [userId, fetchBusiness, refresh]);

  return {
    business,
    isLoading,
    error,
    refetch,
    createBusiness
  };
};