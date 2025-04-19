import { useCallback } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { addBusiness } from '../localdb/services/businessService';
import type { Business as LocalBusiness } from '../types';

const client = generateClient<Schema>();

export function useBusiness() {
  /**
   * Creates a business record via API, then stores it locally with matching _id
   * @param formData Object with business fields (businessName, firstName, lastName, phone, etc.)
   * @returns The created API business object
   */
  const createBusiness = useCallback(async (formData: Omit<LocalBusiness, '_id'>) => {
    // API creation
    const resp = await client.models.Business.create({
      businessName: formData.businessName,
      firstName: formData.firstName,
      lastName: formData.lastName,
      phone: formData.phone,
      // add other fields as needed
    });
    if (!resp.data) {
      throw new Error('API did not return any business data');
    }
    const created = resp.data;
    const id = created.id;
    if (!id) {
      throw new Error('API did not return a valid business id');
    }
    const localBusiness: LocalBusiness = { _id: id, ...formData };
    await addBusiness(localBusiness);
    return created;
  }, []);

  return { createBusiness };
}
