import { useState, useCallback, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { getFirstBusiness, addBusiness } from '../localdb/services/businessService';
import type { Business as LocalBusiness } from '../types';
import { Alert } from 'react-native';

const client = generateClient<Schema>();

export function useBusiness({ userId, refresh, authUser }: {
  userId: string | undefined,
  refresh?: number,
  authUser: any
}) {
  

  const [business, setBusiness] = useState<LocalBusiness | undefined>();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Simplified createBusiness function that handles all state changes
  const createBusiness = useCallback(async (formData: Omit<LocalBusiness, '_id'> & { userId: string, email?: string, _id?: string }) => {
    setIsLoading(true);
    setError(null);
    console.log('[useBusiness] createBusiness called with:', formData);
    try {
      // Use ownerEmail from authUser or fallback to formData.email
      const ownerEmail = authUser?.signInDetails?.loginId || formData.email || '';
      // If _id is provided, skip API create (used for local sync from API), else create via API
      let id = formData._id;
      let created = undefined;
      if (!id) {
        const resp = await client.models.Business.create({
          businessName: formData.businessName,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          userId: formData.userId,
          email: ownerEmail,
          // add other fields as needed
        });
        if (!resp.data) {
          throw new Error('API did not return any business data');
        }
        created = resp.data;
        id = created.id;
        if (!id) {
          throw new Error('API did not return a valid business id');
        }
      }
      const localBusiness: LocalBusiness = { _id: id, ...formData, email: ownerEmail };
      await addBusiness(localBusiness);
      return created || localBusiness;
    } catch (err: any) {
      let message = err?.message || String(err);
      setError(message);
      throw err; // Re-throw to allow form to handle it if needed
    } finally {
      setIsLoading(false);
    }
  }, [authUser]);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('[useBusiness] refetch: fetching local business...');
      let locals = await getFirstBusiness();
      if (!locals) {
        console.log('[useBusiness] No local business found. Fetching from API for userId:', userId);
        const { data } = await client.models.Business.list({
          filter: { owner: { contains: userId } }
        });
        console.log('[useBusiness] API returned:', data);
        if (data && data.length > 0) {
          const ownerEmail = authUser?.signInDetails?.loginId || '';
          for (const apiObj of data) {
            console.log('[useBusiness] Creating local business from API:', apiObj);
            await createBusiness({
              _id: apiObj.id,
              businessName: apiObj.businessName,
              firstName: apiObj.firstName || '',
              lastName: apiObj.lastName || '',
              phone: apiObj.phone || '',
              userId: apiObj.owner || userId || '',
              email: ownerEmail,
            });
          }
          locals = await getFirstBusiness();
        } else {
          console.log('[useBusiness] No business found in API for userId:', userId);
        }
      } else {
        console.log('[useBusiness] Found local business:', locals);
      }
      setBusiness(locals);
      if (!locals) {
        console.warn('[useBusiness] After refetch, business is STILL undefined!');
      }
    } catch (err: any) {
      let message = err?.message || String(err);
      setError(message);
      console.error('[useBusiness] Error fetching/creating business:', message, err);
      Alert.alert('Error', `Failed to load business data. ${message}`);
    } finally {
      setIsLoading(false);
    }
  }, [userId, refresh, authUser, createBusiness]);

  // Automatically fetch or create business when userId or refresh changes
  useEffect(() => {
    if (userId) {
      refetch();
    }
  }, [userId, refresh, refetch]);

  return { business, isLoading, error, refetch, createBusiness };
}
