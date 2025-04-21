import { getRealm } from '../getRealm';
import { Customer } from '../../types';

export async function addCustomer(customer: Customer) {
  const realm = await getRealm();
  let createdCustomer;
  realm.write(() => {
    createdCustomer = realm.create('Customer', customer);
  });
  return createdCustomer;
}

export async function getAllCustomers() {
  const realm = await getRealm();
  return realm.objects('Customer');
}

export async function getCustomerById(id: string) {
  const realm = await getRealm();
  return realm.objectForPrimaryKey('Customer', id);
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
  return updatedCustomer;
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
