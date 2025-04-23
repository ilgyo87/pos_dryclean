import { getRealm } from '../getRealm';
import { Business } from '../../types';

export async function addBusiness(business: Business) {
  const realm = await getRealm();
  realm.write(() => {
    realm.create('Business', business);
  });
  const all = realm.objects<Business>('Business');
  console.log('[DEBUG] All businesses in Realm after write:', JSON.stringify(all));
}

export async function getFirstBusiness(): Promise<Business | undefined> {
  const realm = await getRealm();
  const all = realm.objects<Business>('Business');
  console.log('[DEBUG] All businesses in Realm (from getFirstBusiness):', JSON.stringify(all));
  return all.length > 0 ? all[0] : undefined;
}
