import { useState, useCallback, useEffect, useRef } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { getBusinessByUserId, deleteAllBusinessesExceptUser, addBusiness } from '../localdb/services/businessService';
import type { Business as LocalBusiness } from '../types';
import { Alert } from 'react-native';

const client = generateClient<Schema>();

// Use a single global ref for tracking refetch operations
// This prevents duplicate refetches across component instances
const globalRefetchingRef = { current: false };
const initialFetchDoneRef = { current: false };

export function useBusiness({ userId, refresh, authUser }: {
  userId: string | undefined,
  refresh?: number,
  authUser: any
}) {
  const [business, setBusiness] = useState<LocalBusiness | undefined>();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Track mount state to prevent state updates after unmount
  const isMountedRef = useRef(true);
  // Track when last fetch happened to prevent too many refreshes
  const lastFetchTimeRef = useRef<number>(0);
  
  // Clean up on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Time-based throttling function to prevent excessive refetches
  const shouldRefetch = useCallback((force: boolean): boolean => {
    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchTimeRef.current;
    
    // If forcing refresh or it's been more than 2 seconds since last fetch
    if (force || timeSinceLastFetch > 2000) {
      lastFetchTimeRef.current = now;
      return true;
    }
    
    console.log(`[useBusiness] Throttling refetch - last fetch was ${timeSinceLastFetch}ms ago`);
    return false;
  }, []);

  // Create a business
  const createBusiness = useCallback(async (formData: Omit<LocalBusiness, '_id'> & { userId: string, email?: string, _id?: string }) => {
    if (!isMountedRef.current) return null;
    
    setIsLoading(true);
    setError(null);
    console.log('[useBusiness] createBusiness called');
    
    try {
      // Use ownerEmail from authUser or fallback to formData.email
      const ownerEmail = authUser?.signInDetails?.loginId || formData.email || '';
      
      // Create in API
      let id = formData._id;
      let created = undefined;
      
      if (!id) {
        console.log('[useBusiness] Creating business in API');
        const resp = await client.models.Business.create({
          businessName: formData.businessName,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          userId: formData.userId,
          email: ownerEmail,
        });
        
        if (!resp.data) {
          throw new Error('API did not return any business data');
        }
        
        created = resp.data;
        id = created.id;
        
        if (!id) {
          throw new Error('API did not return a valid business id');
        }
        
        console.log(`[useBusiness] Business created in API with ID: ${id}`);
      }
      
      // Save to local database
      const localBusiness: LocalBusiness = { 
        _id: id, 
        ...formData, 
        email: ownerEmail 
      };
      
      console.log(`[useBusiness] Saving business to local database`);
      await addBusiness(localBusiness);
      
      // After successful creation, delete all other businesses for this user
      if (formData.userId) {
        await deleteAllBusinessesExceptUser(formData.userId);
      }
      
      // Update the local state if component is still mounted
      if (isMountedRef.current) {
        setBusiness(localBusiness);
        setIsLoading(false);
      }
      
      // Mark initial fetch as done
      initialFetchDoneRef.current = true;
      
      return created || localBusiness;
    } catch (err: any) {
      console.error('[useBusiness] Error in createBusiness:', err);
      let message = err?.message || String(err);
      
      if (isMountedRef.current) {
        setError(message);
        setIsLoading(false);
      }
      
      throw err; // Re-throw to allow form to handle it if needed
    }
  }, [authUser]);

  // Refetch business data
  const refetch = useCallback(async (forceRefresh = false) => {
    // Skip if not mounted, already fetching, or throttled
    if (!isMountedRef.current || globalRefetchingRef.current || !shouldRefetch(forceRefresh)) {
      return business;
    }
    
    // Skip if no userId provided
    if (!userId) {
      console.log('[useBusiness] Skipping refetch - no userId provided');
      return business;
    }
    
    console.log(`[useBusiness] Starting refetch with forceRefresh=${forceRefresh}`);
    globalRefetchingRef.current = true;
    
    if (isMountedRef.current) {
      setIsLoading(true);
      setError(null);
    }
    
    try {
      // Try to get business for this specific user ID
      let localBusiness = await getBusinessByUserId(userId);
      
      // If we found a business, update state and optionally return without API call
      if (localBusiness && !forceRefresh) {
        console.log(`[useBusiness] Local business found`);
        
        if (isMountedRef.current) {
          setBusiness(localBusiness);
          setIsLoading(false);
        }
        
        initialFetchDoneRef.current = true;
        globalRefetchingRef.current = false;
        return localBusiness;
      }
      
      // If no local business or forcing refresh, fetch from API
      if (forceRefresh || !localBusiness || !initialFetchDoneRef.current) {
        console.log(`[useBusiness] Fetching from API for userId: ${userId}`);
        
        try {
          const { data } = await client.models.Business.list({
            filter: { owner: { contains: userId } }
          });
          
          console.log(`[useBusiness] API returned ${data?.length || 0} businesses`);
          
          if (data && data.length > 0) {
            const ownerEmail = authUser?.signInDetails?.loginId || '';
            
            // Get the first business from API
            const apiObj = data[0];
            
            console.log(`[useBusiness] Processing business from API`);
            
            try {
              // Create or update this business locally
              await addBusiness({
                _id: apiObj.id,
                businessName: apiObj.businessName,
                firstName: apiObj.firstName || '',
                lastName: apiObj.lastName || '',
                phone: apiObj.phone || '',
                userId: apiObj.owner || userId,
                email: ownerEmail,
                website: apiObj.website || '',
                address: apiObj.address || '',
                city: apiObj.city || '',
                state: apiObj.state || '',
                zipCode: apiObj.zipCode || '',
                logoUrl: apiObj.logoUrl || '',
                logoSource: apiObj.logoSource || '',
              });
              
              // Delete all other businesses for this user
              await deleteAllBusinessesExceptUser(userId);
              
              // Get the updated business
              localBusiness = await getBusinessByUserId(userId);
            } catch (err) {
              console.error(`[useBusiness] Error saving business from API:`, err);
            }
          } else {
            console.log(`[useBusiness] No businesses found in API for userId: ${userId}`);
          }
        } catch (apiErr) {
          console.error('[useBusiness] API fetch error:', apiErr);
        }
      }
      
      // Final state update if still mounted
      if (isMountedRef.current) {
        setBusiness(localBusiness);
        setIsLoading(false);
      }
      
      initialFetchDoneRef.current = true;
      return localBusiness;
    } catch (err: any) {
      console.error('[useBusiness] Error in refetch:', err);
      
      if (isMountedRef.current) {
        setError(err.message || String(err));
        setIsLoading(false);
      }
      
      return business;
    } finally {
      globalRefetchingRef.current = false;
    }
  }, [userId, authUser, business, shouldRefetch]);

  // Initial fetch on mount (only once)
  useEffect(() => {
    if (!initialFetchDoneRef.current && userId) {
      // Only do once across all instances
      console.log('[useBusiness] Doing initial fetch');
      refetch(true);
    }
  }, [userId, refetch]);

  // Regular refetch when refresh or userId changes 
  useEffect(() => {
    if (userId && isMountedRef.current && refresh !== undefined) {
      const delay = Math.random() * 500; // Random delay to avoid concurrent calls
      const timer = setTimeout(() => {
        console.log(`[useBusiness] userId or refresh changed, doing light refetch`);
        // Don't force refresh on this to avoid excessive API calls
        refetch(false);
      }, delay);
      
      return () => clearTimeout(timer);
    }
  }, [userId, refresh, refetch]);

  return { 
    business, 
    isLoading, 
    error, 
    refetch, 
    createBusiness 
  };
}