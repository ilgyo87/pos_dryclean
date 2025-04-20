import { Platform } from 'react-native';
import RNFS from 'react-native-fs';

/**
 * Deletes the Realm database file for development schema resets.
 * Safe to call before opening Realm in development.
 */
export async function resetRealmIfSchemaError() {
  try {
    const realmPath = 'pos-dryclean.realm';
    const realmDir = Platform.OS === 'ios'
      ? RNFS.DocumentDirectoryPath
      : RNFS.ExternalDirectoryPath;
    const fullPath = `${realmDir}/${realmPath}`;
    await RNFS.unlink(fullPath);
    console.log('Realm DB deleted for schema reset.');
  } catch (e) {
    // Ignore error if file does not exist
  }
}
