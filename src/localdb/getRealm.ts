import Realm from 'realm';
import { BusinessSchema, CustomerSchema, CategorySchema, ProductSchema, OrderSchema, GarmentSchema } from './schemas';
// DEV ONLY: Remove Realm file if schema error is likely
import { resetRealmIfSchemaError } from './devRealmTools';

export async function getRealm(): Promise<Realm> {
  if (__DEV__) {
    await resetRealmIfSchemaError();
  }
  const config: Realm.Configuration = {
    path: 'pos-dryclean.realm',
    schema: [BusinessSchema, CustomerSchema, CategorySchema, ProductSchema, OrderSchema, GarmentSchema],
    schemaVersion: 1,
  };
  
  return Realm.open(config);
}
