declare module 'react-native-bluetooth-escpos-printer' {
  export interface BluetoothDevice {
    name: string;
    address: string;
  }

  export interface BluetoothManagerStatic {
    isBluetoothEnabled(): Promise<boolean>;
    enableBluetooth(): Promise<BluetoothDevice[]>;
    disableBluetooth(): Promise<boolean>;
    scanDevices(): Promise<BluetoothDevice[]>;
    getBondedDevices(): Promise<BluetoothDevice[]>;
    connect(address: string): Promise<boolean>;
    disconnect(address: string): Promise<boolean>;
    getConnectedDeviceAddress(): Promise<string>;
    isConnected(): Promise<boolean>;
    openBluetoothSettings(): void;
  }

  export const BluetoothManager: BluetoothManagerStatic;
}
