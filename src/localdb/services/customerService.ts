import { getRealm } from '../getRealm';
import { Customer } from '../../types';

export async function addCustomer(customer: Customer) {
  const realm = await getRealm();
  realm.write(() => {
    realm.create('Customer', customer);
  });
}

export async function getAllCustomers() {
  const realm = await getRealm();
  return realm.objects('Customer');
}
