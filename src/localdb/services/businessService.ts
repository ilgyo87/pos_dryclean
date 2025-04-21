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

export async function getFirstBusiness(userId: string): Promise<Business | undefined> {
  const realm = await getRealm();
  const all = realm.objects<Business>('Business');
  console.log('[DEBUG] All businesses in Realm (from getFirstBusiness):', JSON.stringify(all));
  const list = realm.objects<Business>('Business').filtered('userId == $0', userId);
  console.log('[DEBUG] getFirstBusiness filtered list:', JSON.stringify(list), 'for userId:', userId);
  return list.length > 0 ? list[0] : undefined;
}
