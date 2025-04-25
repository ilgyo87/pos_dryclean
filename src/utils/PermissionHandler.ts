import { Platform, PermissionsAndroid, Alert } from 'react-native';

export const requestBluetoothPermissions = async (): Promise<boolean> => {
  if (Platform.OS === 'android') {
    // Android 12+ (API level 31+)
    if (Platform.Version >= 31) {
      const permissions = [
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      ];

      const granted = await PermissionsAndroid.requestMultiple(permissions);

      if (
        granted[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] === PermissionsAndroid.RESULTS.GRANTED &&
        granted[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] === PermissionsAndroid.RESULTS.GRANTED
      ) {
        return true;
      } else {
        Alert.alert(
          'Bluetooth Permission Required',
          'This app needs Bluetooth permissions to connect to your printer.',
          [{ text: 'OK' }]
        );
        return false;
      }
    }
    // Android 6.0+ (API level 23+) but below Android 12
    else if (Platform.Version >= 23) {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );

      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        return true;
      } else {
        Alert.alert(
          'Location Permission Required',
          'This app needs location permission to discover Bluetooth devices.',
          [{ text: 'OK' }]
        );
        return false;
      }
    }
  }

  // iOS or Android below 6.0 doesn't need runtime permissions
  return true;
};
