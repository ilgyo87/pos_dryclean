declare module 'react-native-thermal-receipt-printer' {
  export interface PrinterOptions {
    type: 'bluetooth' | 'network';
    macAddress?: string;
    interface?: string;
    ip?: string;
    port?: number;
  }

  export interface QRCodeOptions {
    value: string;
    size: number;
    align?: 'left' | 'center' | 'right';
  }

  export interface ThermalPrinterModuleStatic {
    init(options: PrinterOptions): Promise<boolean>;
    printText(text: string): Promise<boolean>;
    printImageBase64(base64: string): Promise<boolean>;
    printQRCode(options: QRCodeOptions): Promise<boolean>;
    printCut(): Promise<boolean>;
    getDeviceList(): Promise<any[]>;
  }

  export const ThermalPrinterModule: ThermalPrinterModuleStatic;
}
