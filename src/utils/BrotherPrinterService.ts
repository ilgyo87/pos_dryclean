// src/utils/BrotherPrinterService.ts
import { Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product } from '../types';
import { generateQRCodeData } from './QRCodeGenerator';
import { 
  discoverPrinters, 
  registerBrotherListener,
  printImage,
  LabelSize,
  Device
} from '@w3lcome/react-native-brother-printers';
import * as FileSystem from 'expo-file-system';

// Storage keys
const PRINTER_STORAGE_KEY = 'BROTHER_QL820NWB_PRINTER_CONFIG';

// Brother printer model settings
export interface BrotherPrinterConfig {
  address: string;
  macAddress?: string; // For Bluetooth
  serialNumber?: string;
  model: string;
  connectionType: 'bluetooth' | 'wifi' | 'usb';
  paperSize: '29mm' | '38mm' | '50mm' | '54mm' | '62mm';
  labelType: 'die-cut' | 'continuous';
  orientation: 'landscape' | 'portrait';
  highQuality: boolean;
  lastConnected?: string;
}

// Default config for QL820NWB
export const DEFAULT_BROTHER_CONFIG: BrotherPrinterConfig = {
  address: '',
  model: 'QL-820NWB',
  connectionType: 'bluetooth',
  paperSize: '62mm',
  labelType: 'die-cut',
  orientation: 'portrait',
  highQuality: true,
};

// For other components to check printer status
export enum BrotherPrinterStatus {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  ERROR = 'error'
}

// Print template types
export type QRLabelTemplate = {
  customerName: string;
  itemName: string;
  starchLevel?: string;
  pressOnly?: boolean;
  itemNotes?: string;
  orderId: string;
  qrData: string;
};

// Mapping from our config to Brother SDK sizes
const paperSizeMapping: Record<string, number> = {
  '29mm': LabelSize.LabelSizeRollW29,
  '38mm': LabelSize.LabelSizeRollW38,
  '50mm': LabelSize.LabelSizeRollW50,
  '54mm': LabelSize.LabelSizeRollW54,
  '62mm': LabelSize.LabelSizeRollW62RB, // RB for QL-820NWB
};

/**
 * Brother QL-820NWB Printer Service Implementation
 * 
 * This service provides methods to connect to and print to a Brother QL-820NWB label printer
 * using the W3lcome Brother Print SDK for React Native
 */
class BrotherPrinterService {
  private static discoveryListenerRegistered = false;
  private static config: BrotherPrinterConfig | null = null;
  private static status: BrotherPrinterStatus = BrotherPrinterStatus.DISCONNECTED;
  private static lastError: string | null = null;
  private static foundPrinters: Device[] = [];
  private static currentPrinter: Device | null = null;
  private static listenerKey: any = null;
  
  /**
   * Initialize the printer service
   * Loads saved printer configuration and attempts to establish connection
   */
  static async initialize(): Promise<boolean> {
    if (Platform.OS === 'web') {
      console.warn('Brother printer service is not available on web platform');
      this.lastError = 'Printing is not supported in web browser';
      this.status = BrotherPrinterStatus.ERROR;
      return false;
    }
    
    try {
      // Load saved configuration
      await this.loadSavedConfig();
      
      if (!this.config) {
        this.lastError = 'No printer configured';
        this.status = BrotherPrinterStatus.DISCONNECTED;
        return false;
      }

      console.log(`[BrotherPrinterService] Connecting to ${this.config.model} via ${this.config.connectionType}`);
      this.status = BrotherPrinterStatus.CONNECTING;
      
      // Register listener for discovered printers
      this.setupDiscoveryListener();
      
      // Perform printer discovery to find available printers
      await discoverPrinters({
        V6: true, // Enable IPv6 discovery
      });
      
      // Wait for discovery to complete (2 seconds)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Find matching printer by address
      const matchingPrinter = this.findMatchingPrinter();
      
      if (matchingPrinter) {
        this.currentPrinter = matchingPrinter;
        this.status = BrotherPrinterStatus.CONNECTED;
        
        // Record last connection time
        if (this.config) {
          this.config.lastConnected = new Date().toISOString();
          await this.saveConfig(this.config);
        }
        
        return true;
      } else {
        this.lastError = `Printer with address ${this.config.address} not found`;
        this.status = BrotherPrinterStatus.DISCONNECTED;
        return false;
      }
    } catch (error) {
      this.lastError = `Failed to initialize printer: ${error}`;
      this.status = BrotherPrinterStatus.ERROR;
      console.error('[BrotherPrinterService] Initialization error:', error);
      return false;
    }
  }
  
  /**
   * Setup the discovery listener for Brother printers
   */
  private static setupDiscoveryListener(): void {
    if (this.discoveryListenerRegistered) return; // Only register once
    this.discoveryListenerRegistered = true;
    this.listenerKey = registerBrotherListener('onDiscoverPrinters', (printers: Device[]) => {
      console.log('[BrotherPrinterService] Listener fired, found printers:', printers);
      this.foundPrinters = printers || [];
      if (this.config && this.foundPrinters.length > 0) {
        const matchingPrinter = this.findMatchingPrinter();
        if (matchingPrinter) {
          this.currentPrinter = matchingPrinter;
          this.status = BrotherPrinterStatus.CONNECTED;
        }
      }
    });
  }
  
  /**
   * Find a printer that matches our saved configuration
   */
  private static findMatchingPrinter(): Device | null {
    if (!this.config || this.foundPrinters.length === 0) {
      return null;
    }
    
    return this.foundPrinters.find(printer => {
      if (this.config?.connectionType === 'wifi' && printer.ipAddress === this.config.address) {
        return true;
      } else if (this.config?.connectionType === 'bluetooth' && printer.macAddress === this.config.address) {
        return true;
      } else if (this.config?.serialNumber && printer.serialNumber === this.config.serialNumber) {
        return true;
      }
      return false;
    }) || null;
  }
  
  /**
   * Load saved printer configuration from AsyncStorage
   */
  private static async loadSavedConfig(): Promise<void> {
    try {
      const configStr = await AsyncStorage.getItem(PRINTER_STORAGE_KEY);
      if (configStr) {
        this.config = JSON.parse(configStr);
        console.log('[BrotherPrinterService] Loaded saved config:', this.config);
      } else {
        console.log('[BrotherPrinterService] No saved config found');
        this.config = null;
      }
    } catch (error) {
      console.error('[BrotherPrinterService] Error loading saved config:', error);
      this.config = null;
    }
  }
  
  /**
   * Save printer configuration to AsyncStorage
   */
  static async saveConfig(config: BrotherPrinterConfig): Promise<void> {
    try {
      this.config = config;
      await AsyncStorage.setItem(PRINTER_STORAGE_KEY, JSON.stringify(config));
      console.log('[BrotherPrinterService] Config saved successfully');
    } catch (error) {
      console.error('[BrotherPrinterService] Error saving config:', error);
      throw error;
    }
  }
  
  /**
   * Get current printer configuration
   */
  static getConfig(): BrotherPrinterConfig | null {
    return this.config;
  }
  
  /**
   * Get current printer status
   */
  static getStatus(): { status: BrotherPrinterStatus; error: string | null } {
    return {
      status: this.status,
      error: this.lastError
    };
  }
  
  /**
   * Create a label image for printing
   */
  private static async createLabelImage(template: QRLabelTemplate): Promise<string> {
    // This is a simplified implementation - in a production app,
    // you would want to use a proper image generation library
    // or a web view to render HTML to an image
    
    // For this implementation, we'll use a very basic approach with
    // a temporary text file that includes the label information
    const tempDir = FileSystem.cacheDirectory || '';
    const tempPath = `${tempDir}label_${Date.now()}.txt`;
    
    let content = `Customer: ${template.customerName}\n`;
    content += `Item: ${template.itemName}\n`;
    
    if (template.starchLevel) {
      content += `Starch: ${template.starchLevel}\n`;
    }
    
    if (template.pressOnly) {
      content += `Press Only: Yes\n`;
    }
    
    if (template.itemNotes) {
      content += `Notes: ${template.itemNotes}\n`;
    }
    
    content += `Order ID: ${template.orderId}\n`;
    content += `QR Data: ${template.qrData}\n`;
    
    // Write the text file
    await FileSystem.writeAsStringAsync(tempPath, content);
    
    return tempPath;
  }
  
  /**
   * Print QR code labels for order items
   * @param items - Order items to print QR codes for
   * @param customerName - Customer name to include on the label
   * @param orderId - Order ID for the QR code data
   */
  static async printQRCodeLabels(
    items: Product[],
    customerName: string,
    orderId: string
  ): Promise<boolean> {
    if (Platform.OS === 'web') {
      console.warn('Printing is not supported in web browser');
      return false;
    }
    
    try {
      // Make sure we're connected
      if (this.status !== BrotherPrinterStatus.CONNECTED) {
        const initialized = await this.initialize();
        if (!initialized) {
          throw new Error('Printer not connected');
        }
      }
      
      if (!this.currentPrinter) {
        throw new Error('No printer connected');
      }
      
      console.log(`[BrotherPrinterService] Printing ${items.length} QR code labels`);
      
      // Get the correct label size from our configuration
      const labelSize = paperSizeMapping[this.config?.paperSize || '62mm'] || LabelSize.LabelSizeRollW62RB;
      
      // Print each item as a separate label
      for (const item of items) {
        // Generate QR code data
        const qrData = generateQRCodeData('Product', {
          id: item._id,
          orderItemId: item.orderItemId || item._id,
          orderId,
          customerId: item.customerId || '',
          businessId: item.businessId || '',
        });
        
        // Create label template with item details
        const label: QRLabelTemplate = {
          customerName,
          itemName: item.name,
          starchLevel: item.starch,
          pressOnly: item.pressOnly,
          itemNotes: item.notes && item.notes.length > 0 ? item.notes[0] : undefined,
          orderId,
          qrData
        };
        
        // Create a label image
        const labelImagePath = await this.createLabelImage(label);
        
        // Print the label
        const printResult = await printImage(
          this.currentPrinter,
          labelImagePath,
          { 
            labelSize,
            isHighQuality: this.config?.highQuality || true
          }
        );
        
        console.log(`[BrotherPrinterService] Label print result:`, printResult);
        
        // Clean up the temporary file
        await FileSystem.deleteAsync(labelImagePath);
      }
      
      console.log('[BrotherPrinterService] QR code labels printed successfully');
      return true;
    } catch (error) {
      this.lastError = `Failed to print QR codes: ${error}`;
      this.status = BrotherPrinterStatus.ERROR;
      console.error('[BrotherPrinterService] QR code printing error:', error);
      return false;
    }
  }
  
  /**
   * Print a test label to verify printer connection
   */
  static async printTestLabel(): Promise<boolean> {
    if (Platform.OS === 'web') {
      console.warn('Printing is not supported in web browser');
      return false;
    }
    
    try {
      // Make sure we're connected
      if (this.status !== BrotherPrinterStatus.CONNECTED) {
        const initialized = await this.initialize();
        if (!initialized) {
          throw new Error('Printer not connected');
        }
      }
      
      if (!this.currentPrinter) {
        throw new Error('No printer connected');
      }
      
      console.log('[BrotherPrinterService] Printing test label');
      
      // Get the correct label size from our configuration
      const labelSize = paperSizeMapping[this.config?.paperSize || '62mm'] || LabelSize.LabelSizeRollW62RB;
      
      // Create a test label
      const testLabel: QRLabelTemplate = {
        customerName: 'Test Customer',
        itemName: 'Test Item',
        orderId: 'TEST-ORDER',
        qrData: 'https://test-qr-code-data.com'
      };
      
      // Create a label image
      const labelImagePath = await this.createLabelImage(testLabel);
      
      // Print the label
      const printResult = await printImage(
        this.currentPrinter,
        labelImagePath,
        { 
          labelSize,
          isHighQuality: this.config?.highQuality || true
        }
      );
      
      console.log('[BrotherPrinterService] Test label print result:', printResult);
      
      // Clean up the temporary file
      await FileSystem.deleteAsync(labelImagePath);
      
      if (printResult) {
        console.log('[BrotherPrinterService] Test label printed successfully');
        return true;
      } else {
        throw new Error('Print operation failed');
      }
    } catch (error) {
      this.lastError = `Failed to print test label: ${error}`;
      this.status = BrotherPrinterStatus.ERROR;
      console.error('[BrotherPrinterService] Test label printing error:', error);
      return false;
    }
  }
  
  /**
   * Disconnect from the printer
   */
  static async disconnect(): Promise<boolean> {
    try {
      console.log('[BrotherPrinterService] Disconnecting from printer');
      
      // Clear the listener reference
      this.listenerKey = null;
      
      this.currentPrinter = null;
      this.status = BrotherPrinterStatus.DISCONNECTED;
      console.log('[BrotherPrinterService] Disconnected successfully');
      return true;
    } catch (error) {
      this.lastError = `Failed to disconnect: ${error}`;
      console.error('[BrotherPrinterService] Disconnection error:', error);
      return false;
    }
  }
  
  /**
   * Search for available Brother printers
   * @returns Array of discovered printer devices
   */
  static async searchPrinters(): Promise<any[]> {
    // Debug: log platform and network info
    try {
      console.log('[BrotherPrinterService] Platform:', Platform.OS);
      const state = await NetInfo.fetch();
      console.log('[BrotherPrinterService] Network state:', state);
    } catch (e) {
      console.warn('[BrotherPrinterService] Failed to get network info:', e);
    }
    try {
      console.log('[BrotherPrinterService] Searching for printers...');
      
      // Set up discovery listener
      this.setupDiscoveryListener();
      
      // Clear previously found printers
      this.foundPrinters = [];
      
      // Start discovery
      await discoverPrinters({
        V6: true, // Enable IPv6 discovery
      });
      
      // Wait for discovery to complete (6 seconds)
      await new Promise(resolve => setTimeout(resolve, 6000));
      
      console.log(`[BrotherPrinterService] Found ${this.foundPrinters.length} printers:`, this.foundPrinters);
      
      // Format the printers to match the expected structure in the UI
      return this.foundPrinters.map(printer => ({
        name: printer.modelName || 'Brother Printer',
        model: printer.modelName || 'QL-820NWB',
        address: printer.ipAddress || printer.macAddress || '',
        connectionType: printer.ipAddress ? 'wifi' : 'bluetooth',
        serialNumber: printer.serialNumber
      }));
    } catch (error) {
      this.lastError = `Failed to search for printers: ${error}`;
      console.error('[BrotherPrinterService] Search error:', error);
      return [];
    }
  }
}

export default BrotherPrinterService;