import { getRealm } from '../getRealm';
import { Customer } from '../../types';

function mapCustomer(item: any): Customer {
  return {
    _id: item._id,
    firstName: item.firstName,
    lastName: item.lastName,
    phone: item.phone || '',
    email: item.email || '',
    address: item.address || '',
    city: item.city || '',
    state: item.state || '',
    zipCode: item.zipCode || '',
    businessId: item.businessId || '',
    cognitoId: item.cognitoId || '',
    notes: item.notes || [],
    createdAt: item.createdAt,
    updatedAt: item.updatedAt || null,
  };
}

export async function addCustomer(customer: Customer) {
  const realm = await getRealm();
  let createdCustomer;
  realm.write(() => {
    createdCustomer = realm.create('Customer', customer);
  });
  // Immediately map to plain JS
  const jsCustomer = mapCustomer(createdCustomer);
  console.log('[CUSTOMER][LOCAL] Created customer in Realm:', JSON.stringify(jsCustomer));
  return jsCustomer;
}

export async function getAllCustomers() {
  const realm = await getRealm();
  const customers = realm.objects('Customer');
  // Map all to plain JS
  return customers.map(mapCustomer);
}

export async function getCustomerById(id: string) {
  const realm = await getRealm();
  const customer = realm.objectForPrimaryKey('Customer', id);
  return customer ? mapCustomer(customer) : null;
}

export async function updateCustomer(id: string, updates: Partial<Customer>) {
  const realm = await getRealm();
  let updatedCustomer;
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
}

export async function deleteCustomer(id: string) {
  const realm = await getRealm();
  let deleted = false;
  realm.write(() => {
    const customer = realm.objectForPrimaryKey('Customer', id);
    if (customer) {
      realm.delete(customer);
      deleted = true;
    }
  });
  return deleted;
}
