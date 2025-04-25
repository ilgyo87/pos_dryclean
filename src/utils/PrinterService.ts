// src/utils/PrinterService.ts
import { Platform } from 'react-native';
import QRCode from 'qrcode';
import { Buffer } from 'buffer';

// Native module reference, loaded lazily in initialize()
let BluetoothEscposPrinter: any = null;

// Type for Order to be printed
interface Order {
  id: string;
  customerId: string;
  items: any[];
  total: number;
  status: string;
  createdAt: Date;
  pickupDate: Date | null;
  employeeId: string;
  notes?: string;
}

// Type for printer connection status
export enum PrinterConnectionStatus {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  ERROR = 'error'
}

/**
 * Service for handling printing operations with the Brother QL820NWB Label Printer
 */
export class PrinterService {
  private static deviceName = 'QL820NWB';
  private static connectionStatus: PrinterConnectionStatus = PrinterConnectionStatus.DISCONNECTED;
  private static lastError: string | null = null;

  /**
   * Initialize the printer service
   */
  static async initialize(): Promise<boolean> {
    if (Platform.OS === 'web') {
      console.warn('Printer service is not available on web platform');
      return false;
    }

    // Load printer module
    try {
      const escpos = require('react-native-bluetooth-escpos-printer');
      BluetoothEscposPrinter = escpos?.BluetoothEscposPrinter || escpos;
    } catch (error) {
      console.error('Failed to load BluetoothEscposPrinter module', error);
      BluetoothEscposPrinter = null;
    }

    // Ensure printer module is loaded
    if (!BluetoothEscposPrinter) {
      this.lastError = 'BluetoothEscposPrinter module not available';
      this.connectionStatus = PrinterConnectionStatus.ERROR;
      return false;
    }

    try {
      // Get list of paired devices
      const devices = await BluetoothEscposPrinter.scanDevices();
      
      // Find our QL820NWB printer
      const printerDevice = devices.find((device: any) => 
        device.name === this.deviceName || device.name.includes('QL820')
      );
      
      if (!printerDevice) {
        this.lastError = `Printer ${this.deviceName} not found. Please pair the printer in your device settings.`;
        this.connectionStatus = PrinterConnectionStatus.ERROR;
        return false;
      }
      
      // Connect to the printer
      this.connectionStatus = PrinterConnectionStatus.CONNECTING;
      await BluetoothEscposPrinter.connectPrinter(printerDevice.address);
      this.connectionStatus = PrinterConnectionStatus.CONNECTED;
      return true;
    } catch (error) {
      this.lastError = `Failed to initialize printer: ${error}`;
      this.connectionStatus = PrinterConnectionStatus.ERROR;
      console.error('Printer initialization error:', error);
      return false;
    }
  }

  /**
   * Get the current connection status
   */
  static getConnectionStatus(): { status: PrinterConnectionStatus, error: string | null } {
    return {
      status: this.connectionStatus,
      error: this.lastError
    };
  }

  /**
   * Print a QR code directly to the printer without saving
   * @param orderId The order ID to encode in the QR code
   */
  static async printQRCode(orderId: string): Promise<boolean> {
    if (Platform.OS === 'web') {
      console.warn('QR code printing is not available on web platform');
      return false;
    }

    try {
      // Ensure printer is connected
      if (this.connectionStatus !== PrinterConnectionStatus.CONNECTED) {
        const initialized = await this.initialize();
        if (!initialized) {
          throw new Error('Printer not connected');
        }
      }

      // Generate QR code as data URL
      const qrCodeDataURL = await QRCode.toDataURL(orderId, {
        errorCorrectionLevel: 'H',
        margin: 1,
        width: 200,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      // Convert data URL to image data
      const base64Data = qrCodeDataURL.replace('data:image/png;base64,', '');
      const imageData = Buffer.from(base64Data, 'base64');

      // Configure printer for label printing
      await BluetoothEscposPrinter.printerInit();
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);
      
      // Set label size for QL820NWB (62mm width)
      await BluetoothEscposPrinter.sendCommand("M 0\r\n");
      await BluetoothEscposPrinter.sendCommand("O R\r\n");
      await BluetoothEscposPrinter.sendCommand("q 800\r\n");
      await BluetoothEscposPrinter.sendCommand("S 4\r\n");
      await BluetoothEscposPrinter.sendCommand("D 8\r\n");
      await BluetoothEscposPrinter.sendCommand("L\r\n");
      
      // Print order ID text
      await BluetoothEscposPrinter.printText(`Order: ${orderId}\n`, {});
      
      // Print QR code
      await BluetoothEscposPrinter.printPic(imageData, { width: 200, left: 100 });
      
      // Print date
      const now = new Date();
      await BluetoothEscposPrinter.printText(`${now.toLocaleDateString()} ${now.toLocaleTimeString()}\n`, {});
      
      // End label
      await BluetoothEscposPrinter.sendCommand("E\r\n");
      
      return true;
    } catch (error) {
      this.lastError = `Failed to print QR code: ${error}`;
      this.connectionStatus = PrinterConnectionStatus.ERROR;
      console.error('QR code printing error:', error);
      return false;
    }
  }

  /**
   * Print a receipt for an order
   * @param order The order details to print
   */
  static async printReceipt(order: Order): Promise<boolean> {
    if (Platform.OS === 'web') {
      console.warn('Receipt printing is not available on web platform');
      return false;
    }

    try {
      // Ensure printer is connected
      if (this.connectionStatus !== PrinterConnectionStatus.CONNECTED) {
        const initialized = await this.initialize();
        if (!initialized) {
          throw new Error('Printer not connected');
        }
      }

      // Configure printer for receipt printing
      await BluetoothEscposPrinter.printerInit();
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);
      
      // Print header
      await BluetoothEscposPrinter.printText("DRY CLEAN RECEIPT\n\n", {
        fonttype: 1,
        widthtimes: 1,
        heigthtimes: 1
      });
      
      // Print order info
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.LEFT);
      await BluetoothEscposPrinter.printText(`Order: ${order.id}\n`, {});
      await BluetoothEscposPrinter.printText(`Date: ${new Date(order.createdAt).toLocaleString()}\n`, {});
      await BluetoothEscposPrinter.printText(`Pickup: ${order.pickupDate ? new Date(order.pickupDate).toLocaleString() : 'Not specified'}\n`, {});
      await BluetoothEscposPrinter.printText(`Employee: ${order.employeeId}\n`, {});
      await BluetoothEscposPrinter.printText(`Customer ID: ${order.customerId}\n`, {});
      
      // Print divider
      await BluetoothEscposPrinter.printText("--------------------------------\n", {});
      
      // Print items
      await BluetoothEscposPrinter.printText("ITEMS\n", {
        fonttype: 1,
        widthtimes: 0,
        heigthtimes: 0
      });
      
      for (const item of order.items) {
        const optionsText = item.options 
          ? Object.entries(item.options)
              .filter(([_, value]) => value !== undefined && value !== '')
              .map(([key, value]) => `${key}: ${value}`)
              .join(', ')
          : '';
          
        await BluetoothEscposPrinter.printText(`${item.name} x${item.quantity}\n`, {});
        if (optionsText) {
          await BluetoothEscposPrinter.printText(`  ${optionsText}\n`, {});
        }
        await BluetoothEscposPrinter.printText(`  $${(item.price * item.quantity).toFixed(2)}\n`, {});
      }
      
      // Print divider
      await BluetoothEscposPrinter.printText("--------------------------------\n", {});
      
      // Print total
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.RIGHT);
      await BluetoothEscposPrinter.printText(`TOTAL: $${order.total.toFixed(2)}\n\n`, {
        fonttype: 1,
        widthtimes: 1,
        heigthtimes: 1
      });
      
      // Print QR code
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);
      
      // Generate QR code as data URL
      const qrCodeDataURL = await QRCode.toDataURL(order.id, {
        errorCorrectionLevel: 'H',
        margin: 1,
        width: 150,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      // Convert data URL to image data
      const base64Data = qrCodeDataURL.replace('data:image/png;base64,', '');
      const imageData = Buffer.from(base64Data, 'base64');
      
      // Print QR code
      await BluetoothEscposPrinter.printPic(imageData, { width: 150, left: 150 });
      
      // Print footer
      await BluetoothEscposPrinter.printText("\nThank you for your business!\n", {});
      await BluetoothEscposPrinter.printText("Please present this receipt or QR code\nwhen picking up your order.\n\n\n", {});
      
      // Cut paper
      await BluetoothEscposPrinter.cutOnePoint();
      
      return true;
    } catch (error) {
      this.lastError = `Failed to print receipt: ${error}`;
      this.connectionStatus = PrinterConnectionStatus.ERROR;
      console.error('Receipt printing error:', error);
      return false;
    }
  }

  /**
   * Disconnect from the printer
   */
  static async disconnect(): Promise<boolean> {
    if (Platform.OS === 'web') {
      return false;
    }

    try {
      if (this.connectionStatus === PrinterConnectionStatus.CONNECTED) {
        await BluetoothEscposPrinter.disconnect();
        this.connectionStatus = PrinterConnectionStatus.DISCONNECTED;
      }
      return true;
    } catch (error) {
      this.lastError = `Failed to disconnect printer: ${error}`;
      console.error('Printer disconnection error:', error);
      return false;
    }
  }
}

export default PrinterService;
