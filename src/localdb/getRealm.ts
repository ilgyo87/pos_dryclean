// src/localdb/getRealm.ts
import Realm from 'realm';
import { BusinessSchema, CustomerSchema, CategorySchema, ProductSchema, OrderSchema, EmployeeSchema, LocationSchema } from './schemas';
// DEV ONLY: Remove Realm file if schema error is likely
import { resetRealmIfSchemaError } from './devRealmTools';

// Singleton/global Realm instance
let globalRealm: Realm | null = null;

/**
 * Gets the singleton Realm instance (opens if not already open)
 */
export async function getRealm(): Promise<Realm> {
  if (globalRealm && !globalRealm.isClosed) {
    return globalRealm;
  }
  try {
    // Uncomment for development schema resets if needed
    // if (__DEV__) {
    //   await resetRealmIfSchemaError();
    // }
    const config: Realm.Configuration = {
      path: 'pos-dryclean.realm',
      schema: [BusinessSchema, CustomerSchema, CategorySchema, ProductSchema, OrderSchema, EmployeeSchema, LocationSchema],
      schemaVersion: 1,
      onMigration: (oldRealm, newRealm) => {
        // Migration logic if needed
        console.log(`Migrating Realm from ${oldRealm.schemaVersion} to ${newRealm.schemaVersion}`);
      }
    };
    globalRealm = await Realm.open(config);
    console.log(`[getRealm] Opened singleton Realm instance`);
    return globalRealm;
  } catch (error) {
    console.error('[getRealm] Error opening Realm:', error);
    throw error;
  }
}

/**
 * Utility to close the singleton Realm instance (call on app shutdown/background)
 */
export function closeAllRealms() {
  if (globalRealm && !globalRealm.isClosed) {
    try {
      globalRealm.close();
      console.log('[closeAllRealms] Closed singleton Realm instance');
    } catch (error) {
      console.error('[closeAllRealms] Error closing Realm:', error);
    }
    globalRealm = null;
  }
}

/**
 * Utility to close a specific realm instance (for compatibility, but not needed with singleton)
 */
export function closeRealm(realm: Realm) {
  if (realm && !realm.isClosed) {
    try {
      realm.close();
      console.log('[closeRealm] Closed Realm instance');
    } catch (error) {
      console.error('[closeRealm] Error closing Realm:', error);
    }
  }
}
