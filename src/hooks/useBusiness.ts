import { useState, useCallback } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { getFirstBusiness, addBusiness } from '../localdb/services/businessService';
import type { Business as LocalBusiness } from '../types';
import { Alert } from 'react-native';

const client = generateClient<Schema>();

export function useBusiness({ userId, refresh, authUser }: { userId: string | undefined, refresh: number, authUser: any }) {
  const [business, setBusiness] = useState<LocalBusiness | undefined>();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch business (local + API sync)
  const createBusiness = useCallback(async (formData: Omit<LocalBusiness, '_id'> & { userId: string, email: string, _id?: string }) => {
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
  }, [authUser]);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (!userId) {
        setBusiness(undefined);
        setIsLoading(false);
        return;
      }
      let locals = await getFirstBusiness(userId);
      if (!locals) {
        const { data } = await client.models.Business.list({
          filter: { owner: { contains: userId } }
        });
        if (data && data.length > 0) {
          const ownerEmail = authUser?.signInDetails?.loginId || '';
          for (const apiObj of data) {
            await createBusiness({
              _id: apiObj.id,
              businessName: apiObj.businessName,
              firstName: apiObj.firstName || '',
              lastName: apiObj.lastName || '',
              phone: apiObj.phone || '',
              userId: apiObj.owner || userId,
              email: ownerEmail,
            });
          }
          locals = await getFirstBusiness(userId);
        }
      }
      setBusiness(locals);
    } catch (err: any) {
      let message = err?.message || String(err);
      setError(message);
      Alert.alert('Error', `Failed to load business data. ${message}`);
    } finally {
      setIsLoading(false);
    }
  }, [userId, refresh, authUser, createBusiness]);

  return { business, isLoading, error, refetch, createBusiness };
}
