import Realm from 'realm';
import { CustomerSchema, CategorySchema, ProductSchema, OrderSchema } from './schemas';

export function getRealm(): Promise<Realm> {
  const config: Realm.Configuration = {
    path: 'pos-dryclean.realm',
    schema: [CustomerSchema, CategorySchema, ProductSchema, OrderSchema],
    schemaVersion: 1,
  };
  
  return Realm.open(config);
}
