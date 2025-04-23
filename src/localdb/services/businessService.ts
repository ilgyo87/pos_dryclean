import { getRealm } from '../getRealm';
import { Business } from '../../types';

function mapBusiness(item: any) {
  return { ...item };
}

export async function addBusiness(business: Business) {
  const realm = await getRealm();
  realm.write(() => {
    realm.create('Business', business);
  });
  const all = realm.objects('Business');
  const jsAll = all.map(mapBusiness);
  console.log('[DEBUG] All businesses in Realm after write:', JSON.stringify(jsAll));
}

export async function getFirstBusiness(): Promise<Business | undefined> {
  const realm = await getRealm();
  const all = realm.objects('Business');
  const jsAll = all.map(mapBusiness);
  console.log('[DEBUG] All businesses in Realm (from getFirstBusiness):', JSON.stringify(jsAll));
  return jsAll.length > 0 ? jsAll[0] : undefined;
}
