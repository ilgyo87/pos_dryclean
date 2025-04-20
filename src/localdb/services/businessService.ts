import { getRealm } from '../index';
import { Business } from '../../types';

export async function addBusiness(business: Business) {
  const realm = await getRealm();
  realm.write(() => {
    realm.create('Business', business);
  });
}

export async function getFirstBusiness(userId: string): Promise<Business | undefined> {
  const realm = await getRealm();
  const list = realm.objects<Business>('Business').filtered('userId == $0', userId);
  return list.length > 0 ? list[0] : undefined;
}
