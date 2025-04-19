import { getRealm } from '../index';
import { Business } from '../../types';

export async function addBusiness(business: Business) {
  const realm = await getRealm();
  realm.write(() => {
    realm.create('Business', business);
  });
}

export async function getAllBusinesses() {
  const realm = await getRealm();
  return realm.objects('Business');
}
