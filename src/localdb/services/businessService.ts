import { getRealm } from '../getRealm';
import { Business } from '../../types';

function mapBusiness(item: any) {
  return { ...item };
}

/**
 * Add a business to the local Realm database
 * If a business with the same ID already exists, it will be updated instead
 */
export async function addBusiness(business: Business) {
  const realm = await getRealm();
  
  // Check if a business with this ID already exists
  const existingBusiness = realm.objectForPrimaryKey('Business', business._id);
  
  realm.write(() => {
    if (existingBusiness) {
      console.log(`[BusinessService] Updating existing business with ID: ${business._id}`);
      // Update existing business properties
      Object.keys(business).forEach(key => {
        if (key !== '_id' && business[key as keyof Business] !== undefined) {
          (existingBusiness as any)[key] = business[key as keyof Business];
        }
      });
    } else {
      console.log(`[BusinessService] Creating new business with ID: ${business._id}`);
      realm.create('Business', business);
    }
  });
}

/**
 * Get the first business in the database
 */
export async function getFirstBusiness(): Promise<Business | undefined> {
  const realm = await getRealm();
  const businesses = realm.objects('Business');
  const jsAll = businesses.map(mapBusiness);
  return jsAll.length > 0 ? jsAll[0] : undefined;
}

/**
 * Get a business by user ID - this is the primary way to retrieve a business
 * Returns undefined if no business is found for the given user ID
 */
export async function getBusinessByUserId(userId: string): Promise<Business | undefined> {
  if (!userId) {
    console.log('[BusinessService] getBusinessByUserId called with empty userId');
    return undefined;
  }
  
  console.log(`[BusinessService] Finding business for userId: ${userId}`);
  const realm = await getRealm();
  
  try {
    const businesses = realm.objects('Business').filtered('userId == $0', userId);
    
    if (businesses.length === 0) {
      console.log(`[BusinessService] No business found for userId: ${userId}`);
      return undefined;
    }
    
    if (businesses.length > 1) {
      console.log(`[BusinessService] Warning: Multiple businesses (${businesses.length}) found for userId: ${userId}, returning first`);
    }
    
    const result = mapBusiness(businesses[0]);
    // Suppressed verbose log to avoid repeating on every fetch
    // console.log(`[BusinessService] Found business for userId ${userId}: ${JSON.stringify(result)}`);
    return result;
  } catch (error) {
    console.error(`[BusinessService] Error finding business for userId ${userId}:`, error);
    return undefined;
  }
}

/**
 * Delete all businesses except for the one belonging to the specified user
 */
export async function deleteAllBusinessesExceptUser(userId: string): Promise<void> {
  if (!userId) {
    console.log('[BusinessService] deleteAllBusinessesExceptUser called with empty userId');
    return;
  }
  
  console.log(`[BusinessService] Deleting all businesses except for userId: ${userId}`);
  const realm = await getRealm();
  
  try {
    realm.write(() => {
      const businessesToDelete = realm.objects('Business').filtered('userId != $0', userId);
      console.log(`[BusinessService] Found ${businessesToDelete.length} businesses to delete`);
      realm.delete(businessesToDelete);
      console.log(`[BusinessService] Successfully deleted businesses`);
    });
  } catch (error) {
    console.error(`[BusinessService] Error deleting businesses except for userId ${userId}:`, error);
  }
}

/**
 * Get all businesses in the database
 */
export async function getAllBusinesses(): Promise<Business[]> {
  const realm = await getRealm();
  const all = realm.objects('Business');
  return all.map(mapBusiness);
}

/**
 * Get a business by ID
 */
export async function getBusinessById(id: string): Promise<Business | undefined> {
  const realm = await getRealm();
  const business = realm.objectForPrimaryKey('Business', id);
  return business ? mapBusiness(business) : undefined;
}
