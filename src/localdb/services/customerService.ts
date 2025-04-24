// src/localdb/services/customerService.ts
import { getRealm } from '../getRealm';
import { Customer } from '../../types';

/**
 * Map a Realm customer object to a plain JavaScript object
 * This prevents holding references to Realm objects
 */
function mapCustomer(item: any): Customer {
  if (!item) {
    console.warn('[mapCustomer] Received null or undefined item');
    return null as any;
  }
  
  try {
    // First check if we need to access Realm's properties
    // Some Realm objects need to be accessed via different methods
    const getProperty = (obj: any, prop: string) => {
      try {
        // Try direct property access first
        if (prop in obj) {
          return obj[prop];
        }
        
        // For Realm objects with custom accessors
        if (typeof obj.get === 'function') {
          return obj.get(prop);
        }
        
        return undefined;
      } catch (err) {
        console.warn(`[mapCustomer] Error accessing property ${prop}:`, err);
        return undefined;
      }
    };
    
    // Create a completely detached copy with no references to Realm
    const customer = {
      _id: String(getProperty(item, '_id') || ''),
      firstName: String(getProperty(item, 'firstName') || ''),
      lastName: String(getProperty(item, 'lastName') || ''),
      phone: String(getProperty(item, 'phone') || ''),
      email: String(getProperty(item, 'email') || ''),
      address: String(getProperty(item, 'address') || ''),
      city: String(getProperty(item, 'city') || ''),
      state: String(getProperty(item, 'state') || ''),
      zipCode: String(getProperty(item, 'zipCode') || ''),
      businessId: String(getProperty(item, 'businessId') || ''),
      cognitoId: getProperty(item, 'cognitoId') ? String(getProperty(item, 'cognitoId')) : undefined,
      notes: Array.isArray(getProperty(item, 'notes')) ? [...getProperty(item, 'notes')] : [],
      createdAt: getProperty(item, 'createdAt') ? new Date(getProperty(item, 'createdAt')) : new Date(),
      updatedAt: getProperty(item, 'updatedAt') ? new Date(getProperty(item, 'updatedAt')) : undefined,
      imageName: getProperty(item, 'imageName') ? String(getProperty(item, 'imageName')) : '',
      location: getProperty(item, 'location') ? { ...getProperty(item, 'location') } : undefined
    };
    
    console.log(`[mapCustomer] Successfully mapped customer: ${customer._id}`);
    return customer;
  } catch (e) {
    console.error('[mapCustomer] Error mapping customer:', e);
    // Return a minimal valid customer to avoid errors
    return {
      _id: typeof item._id === 'string' ? item._id : String(Date.now()),
      firstName: '',
      lastName: '',
      phone: '',
      notes: [],
      createdAt: new Date()
    } as any;
  }
}

/**
 * Add a new customer to Realm database
 */
export async function addCustomer(customer: Customer) {
  const realm = await getRealm();
  let createdCustomer;
  try {
    realm.write(() => {
      createdCustomer = realm.create('Customer', customer);
    });
    // Immediately map to plain JS object
    const jsCustomer = mapCustomer(createdCustomer);
    console.log('[CUSTOMER][LOCAL] Created customer in Realm:', JSON.stringify(jsCustomer));
    return jsCustomer;
  } catch (e) {
    console.error('[CUSTOMER][LOCAL] Error adding customer:', e);
    throw e;
  } finally {
    // Always close the realm instance when done

  }
}

/**
 * Get all customers from Realm database, mapped to plain JS objects
 */
export async function getAllCustomers() {
  let realm = null;
  try {
    realm = await getRealm();
    
    // Check if realm is valid before proceeding
    if (!realm || realm.isClosed) {
      console.error('[CUSTOMER][LOCAL] Realm is closed or invalid');
      return [];
    }
    
    // Access the collection
    const customers = realm.objects('Customer');
    
    // Create a completely detached copy immediately
    const detachedResults = [];
    for (let i = 0; i < customers.length; i++) {
      try {
        const mappedCustomer = mapCustomer(customers[i]);
        if (mappedCustomer) {
          detachedResults.push(mappedCustomer);
        }
      } catch (err) {
        console.error('[CUSTOMER][LOCAL] Error mapping customer at index', i, err);
      }
    }
    
    return detachedResults;
  } catch (e) {
    console.error('[CUSTOMER][LOCAL] Error getting all customers:', e);
    return [];
  } finally {
    // Always close the realm instance when done

  }
}

/**
 * Get a customer by ID
 */
export async function getCustomerById(id: string) {
  const realm = await getRealm();
  try {
    const customer = realm.objectForPrimaryKey('Customer', id);
    return customer ? mapCustomer(customer) : null;
  } catch (e) {
    console.error('[CUSTOMER][LOCAL] Error getting customer by ID:', e);
    return null;
  } finally {

  }
}

/**
 * Update a customer in Realm database
 */
export async function updateCustomer(id: string, updates: Partial<Customer>) {
  const realm = await getRealm();
  let updatedCustomer;
  try {
    realm.write(() => {
      const customer = realm.objectForPrimaryKey('Customer', id);
      if (customer) {
        Object.keys(updates).forEach(key => {
          // @ts-ignore
          customer[key] = updates[key];
        });
        updatedCustomer = customer;
      }
    });
    return updatedCustomer ? mapCustomer(updatedCustomer) : null;
  } catch (e) {
    console.error('[CUSTOMER][LOCAL] Error updating customer:', e);
    throw e;
  } finally {

  }
}

/**
 * Delete a customer from Realm database
 */
export async function deleteCustomer(id: string) {
  const realm = await getRealm();
  let deleted = false;
  try {
    realm.write(() => {
      const customer = realm.objectForPrimaryKey('Customer', id);
      if (customer) {
        realm.delete(customer);
        deleted = true;
      }
    });
    return deleted;
  } catch (e) {
    console.error('[CUSTOMER][LOCAL] Error deleting customer:', e);
    throw e;
  } finally {

  }
}