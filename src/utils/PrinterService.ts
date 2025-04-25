// src/utils/PrinterService.ts
import { Platform } from 'react-native';
import { ThermalPrinterModule } from 'react-native-thermal-receipt-printer';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage key for saved printer
const PRINTER_STORAGE_KEY = 'POS_DRYCLEAN_PRINTER_ADDRESS';

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

// Type for Product in QRCodes
interface Product {
  _id: string;
  orderItemId?: string;
  name: string;
  customerId?: string;
  businessId?: string;
  starch?: 'none' | 'light' | 'medium' | 'heavy';
  pressOnly?: boolean;
  notes?: string[];
}

// Type for printer connection status
export enum PrinterConnectionStatus {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  ERROR = 'error'
}

/**
 * Service for handling printing operations with thermal printers
 */
class PrinterService {
  private static connectionStatus: PrinterConnectionStatus = PrinterConnectionStatus.DISCONNECTED;
  private static lastError: string | null = null;
  private static selectedPrinter: { device_name?: string; inner_mac_address?: string; address?: string } | null = null;

  /**
   * Initialize the printer service
   */
  static async initialize(): Promise<boolean> {
    if (Platform.OS === 'web') {
      console.warn('Printer service is not available on web platform');
      return false;
    }

    try {
      // First try to load a saved printer
      await this.loadSavedPrinter();

      // Initialize the printer module
      if (this.selectedPrinter?.address) {
        await ThermalPrinterModule.init({
          type: 'bluetooth',
          macAddress: this.selectedPrinter.address,
          interface: this.selectedPrinter.address
        });
        this.connectionStatus = PrinterConnectionStatus.CONNECTED;
        return true;
      } else {
        this.lastError = 'No printer configured. Please set up a printer first.';
        this.connectionStatus = PrinterConnectionStatus.DISCONNECTED;
        return false;
      }
    } catch (error) {
      this.lastError = `Failed to initialize thermal printer: ${error}`;
      this.connectionStatus = PrinterConnectionStatus.ERROR;
      console.error('Thermal printer initialization error:', error);
      return false;
    }
  }

  /**
   * Load the saved printer from AsyncStorage
   */
  private static async loadSavedPrinter(): Promise<void> {
    try {
      const printerData = await AsyncStorage.getItem(PRINTER_STORAGE_KEY);
      if (printerData) {
        this.selectedPrinter = JSON.parse(printerData);
      }
    } catch (error) {
      console.error('Error loading saved printer:', error);
    }
  }

  /**
   * Save the printer to AsyncStorage
   */
  static async savePrinter(printer: any): Promise<void> {
    try {
      await AsyncStorage.setItem(PRINTER_STORAGE_KEY, JSON.stringify(printer));
      this.selectedPrinter = printer;
    } catch (error) {
      console.error('Error saving printer:', error);
    }
  }

  /**
   * Get the current connection status
   */
  static getConnectionStatus(): { status: PrinterConnectionStatus, error: string | null, printer: any } {
    return {
      status: this.connectionStatus,
      error: this.lastError,
      printer: this.selectedPrinter
    };
  }

  /**
   * Print a QR code to the printer
   * @param data The data to encode in the QR code
   */
  static async printQRCode(data: string): Promise<boolean> {
    if (Platform.OS === 'web') {
      console.warn('QR code printing is not available on web platform');
      return false;
    }
    
    try {
      if (this.connectionStatus !== PrinterConnectionStatus.CONNECTED) {
        const initialized = await this.initialize();
        if (!initialized) {
          throw new Error('Printer not connected');
        }
      }
      
      await ThermalPrinterModule.printQRCode({
        value: data,
        size: 8,
        align: 'center'
      });
      
      return true;
    } catch (error) {
      this.lastError = `Failed to print QR code: ${error}`;
      this.connectionStatus = PrinterConnectionStatus.ERROR;
      console.error('QR code printing error:', error);
      return false;
    }
  }

  /**
   * Print multiple QR codes for products
   * @param items Products to print QR codes for
   * @param customerName Customer name to print on labels
   * @param orderId Order ID for reference
   */
  static async printQRCodes(
    items: Product[],
    customerName: string,
    orderId: string
  ): Promise<boolean> {
    if (Platform.OS === 'web') {
      console.warn('QR code printing is not available on web platform');
      return false;
    }
    
    try {
      if (this.connectionStatus !== PrinterConnectionStatus.CONNECTED) {
        const initialized = await this.initialize();
        if (!initialized) {
          throw new Error('Printer not connected');
        }
      }
      
      // Print header
      await ThermalPrinterModule.printText(`\n`);
      
      // Print each item as a separate label
      for (const item of items) {
        // Generate QR code data
        const qrData = JSON.stringify({
          id: item._id,
          orderItemId: item.orderItemId || item._id,
          orderId: orderId,
          customerId: item.customerId || '',
          businessId: item.businessId || '',
        });
        
        // Print customer name
        await ThermalPrinterModule.printText(`${customerName}\n`);
        
        // Print item name
        await ThermalPrinterModule.printText(`${item.name}\n`);
        
        // Print options if available
        if (item.starch) {
          await ThermalPrinterModule.printText(`Starch: ${item.starch}\n`);
        }
        
        if (item.pressOnly) {
          await ThermalPrinterModule.printText(`Press Only\n`);
        }
        
        if (item.notes && item.notes.length > 0) {
          await ThermalPrinterModule.printText(`Note: ${item.notes[0]}\n`);
        }
        
        // Print QR code
        await ThermalPrinterModule.printQRCode({
          value: qrData,
          size: 8,
          align: 'center'
        });
        
        // Add spacing between items
        await ThermalPrinterModule.printText(`\n\n`);
      }
      
      // Cut the paper
      await ThermalPrinterModule.printCut();
      
      return true;
    } catch (error) {
      this.lastError = `Failed to print QR codes: ${error}`;
      this.connectionStatus = PrinterConnectionStatus.ERROR;
      console.error('QR code printing error:', error);
      return false;
    }
  }

  /**
   * Print text directly to the printer
   * @param text The text to print
   */
  static async printText(text: string): Promise<boolean> {
    if (Platform.OS === 'web') {
      console.warn('Text printing is not available on web platform');
      return false;
    }
    
    try {
      if (this.connectionStatus !== PrinterConnectionStatus.CONNECTED) {
        const initialized = await this.initialize();
        if (!initialized) {
          throw new Error('Printer not connected');
        }
      }
      
      await ThermalPrinterModule.printText(text);
      return true;
    } catch (error) {
      this.lastError = `Failed to print text: ${error}`;
      this.connectionStatus = PrinterConnectionStatus.ERROR;
      console.error('Text printing error:', error);
      return false;
    }
  }

  /**
   * Print a receipt for an order
   * @param order The order details to print
   * @param businessName The business name to print on the receipt
   */
  static async printReceipt(order: Order, businessName: string): Promise<boolean> {
    if (Platform.OS === 'web') {
      console.warn('Receipt printing is not available on web platform');
      return false;
    }
    
    try {
      if (this.connectionStatus !== PrinterConnectionStatus.CONNECTED) {
        const initialized = await this.initialize();
        if (!initialized) {
          throw new Error('Printer not connected');
        }
      }
      
      // Print business name
      await ThermalPrinterModule.printText(`\n${businessName}\n\n`);
      
      // Print order details
      await ThermalPrinterModule.printText(`Order: ${order.id}\n`);
      await ThermalPrinterModule.printText(`Date: ${new Date(order.createdAt).toLocaleDateString()}\n`);
      
      if (order.pickupDate) {
        await ThermalPrinterModule.printText(`Pickup: ${new Date(order.pickupDate).toLocaleDateString()}\n`);
      }
      
      await ThermalPrinterModule.printText(`Status: ${order.status}\n`);
      await ThermalPrinterModule.printText(`--------------------------------\n`);
      
      // Print items
      await ThermalPrinterModule.printText(`ITEMS:\n`);
      
      for (const item of order.items) {
        await ThermalPrinterModule.printText(`${item.name}\n`);
        
        if (item.starch) {
          await ThermalPrinterModule.printText(`  Starch: ${item.starch}\n`);
        }
        
        if (item.pressOnly) {
          await ThermalPrinterModule.printText(`  Press Only\n`);
        }
        
        await ThermalPrinterModule.printText(`  $${(item.price || 0).toFixed(2)}\n`);
      }
      
      await ThermalPrinterModule.printText(`--------------------------------\n`);
      await ThermalPrinterModule.printText(`TOTAL: $${order.total.toFixed(2)}\n\n`);
      await ThermalPrinterModule.printText(`Thank you for your business!\n`);
      await ThermalPrinterModule.printText(`\n\n\n`);
      
      // Cut the paper
      await ThermalPrinterModule.printCut();
      
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
      this.connectionStatus = PrinterConnectionStatus.DISCONNECTED;
      return true;
    } catch (error) {
      this.lastError = `Failed to disconnect printer: ${error}`;
      console.error('Printer disconnection error:', error);
      return false;
    }
  }
}

export default PrinterService;