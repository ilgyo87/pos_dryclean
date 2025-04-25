// src/hooks/useBusiness.ts
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
      setIsLoading(true);
      setError(null);
      
      const response = await client.models.Business.list({
        filter: { userId: { eq: userId } }
      });
      
      console.log(`[useBusiness] API returned ${response.data.length} businesses`);
      
      if (response.data && response.data.length > 0) {
        setBusiness(response.data[0]);
      } else {
        console.log('[useBusiness] No businesses found in API for userId:', userId);
        setBusiness(null);
      }
      
      // Update our tracking refs
      hasInitialFetchedRef.current = true;
      currentRefreshRef.current = refresh;
      needsRefetch = false;
    } catch (err: any) {
      console.error('[useBusiness] Error fetching business:', err);
      setError(err.message || 'Failed to fetch business data');
      setBusiness(null);
    } finally {
      setIsLoading(false);
    }
  }, [userId, refresh]);

  // Create a new business
  const createBusiness = useCallback(async (data: any) => {
    if (!userId) {
      throw new Error('User ID is required to create a business');
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const response = await client.models.Business.create({
        ...data,
        userId
      });
      
      setBusiness(response);
      needsRefetch = true;
      return response;
    } catch (err: any) {
      console.error('[useBusiness] Error creating business:', err);
      setError(err.message || 'Failed to create business');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Force a refetch of business data
  const refetch = useCallback((force: boolean = false) => {
    console.log('[useBusiness] Refetch called with force =', force);
    if (force) {
      needsRefetch = true;
    }
    fetchBusiness(force);
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
    };
  }, [forceRefreshOnMount]);

  // Fetch on mount and when dependencies change
  useEffect(() => {
    if (userId) {
      fetchBusiness();
    } else {
      setIsLoading(false);
    }
  }, [userId, fetchBusiness, refresh]);

  return {
    business,
    isLoading,
    error,
    refetch,
    createBusiness
  };
};