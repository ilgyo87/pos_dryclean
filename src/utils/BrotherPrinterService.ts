// src/utils/BrotherPrinterService.ts
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage key for saved printer
const PRINTER_STORAGE_KEY = 'BROTHER_PRINTER_CONFIG';

// Printer status enum
export enum PrinterStatus {
  DISCONNECTED = 'disconnected',
  CONNECTED = 'connected',
  ERROR = 'error'
}

// Label size enum (matching Brother SDK values)
export enum LabelSize {
  LabelSizeRollW29 = 29,
  LabelSizeRollW38 = 38,
  LabelSizeRollW50 = 50,
  LabelSizeRollW54 = 54,
  LabelSizeRollW62 = 62
}

// Configuration for Brother printer
export interface PrinterConfig {
  address: string;
  macAddress?: string;
  serialNumber?: string;
  model: string;
  paperSize: '29mm' | '38mm' | '50mm' | '54mm' | '62mm';
  lastConnected?: string;
}

// Print options
export interface PrintOptions {
  labelSize: number;
  isHighQuality: boolean;
}

// Mock device type (actual implementation would use SDK types)
export interface Device {
  modelName?: string;
  ipAddress?: string;
  serialNumber?: string;
  macAddress?: string;
  printerName?: string;
}

// Brother Printer Service class
class BrotherPrinterService {
  private static config: PrinterConfig | null = null;
  private static lastError: string | null = null;
  private static currentPrinter: Device | null = null;
  private static status: PrinterStatus = PrinterStatus.DISCONNECTED;
  
  /**
   * Initialize the printer service
   * Loads saved configuration
   */
  static async initialize(): Promise<boolean> {
    try {
      // Load saved configuration
      await this.loadSavedConfig();
      
      // If we have a config, consider the printer connected
      if (this.config) {
        this.currentPrinter = {
          modelName: this.config.model,
          ipAddress: this.config.address,
          serialNumber: this.config.serialNumber,
          macAddress: this.config.macAddress
        };
        this.status = PrinterStatus.CONNECTED;
        console.log('[BrotherPrinterService] Initialized with saved config');
        return true;
      }
      
      console.log('[BrotherPrinterService] No saved config found');
      return false;
    } catch (error) {
      this.lastError = `Failed to initialize: ${error}`;
      console.error('[BrotherPrinterService] Initialization error:', error);
      return false;
    }
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
  static async saveConfig(config: PrinterConfig): Promise<void> {
    try {
      // Add timestamp
      const configWithTimestamp = {
        ...config,
        lastConnected: new Date().toISOString()
      };
      
      this.config = configWithTimestamp;
      await AsyncStorage.setItem(PRINTER_STORAGE_KEY, JSON.stringify(configWithTimestamp));
      console.log('[BrotherPrinterService] Config saved successfully');
    } catch (error) {
      console.error('[BrotherPrinterService] Error saving config:', error);
      throw error;
    }
  }
  
  /**
   * Reset (clear) the saved printer configuration
   */
  static async resetConfig(): Promise<void> {
    try {
      await AsyncStorage.removeItem(PRINTER_STORAGE_KEY);
      this.config = null;
      this.currentPrinter = null;
      this.status = PrinterStatus.DISCONNECTED;
      console.log('[BrotherPrinterService] Printer config reset');
    } catch (error) {
      console.error('[BrotherPrinterService] Error resetting config:', error);
    }
  }

  /**
   * Get current printer configuration
   */
  static getConfig(): PrinterConfig | null {
    return this.config;
  }

  /**
   * Get current printer status
   */
  static getStatus(): { status: PrinterStatus; error: string | null } {
    return { 
      status: this.status,
      error: this.lastError
    };
  }

  /**
   * Search for available Brother printers on the network
   * This is a mock implementation - actual implementation would use SDK
   */
  static async searchPrinters(): Promise<Device[]> {
    console.log('[BrotherPrinterService] Searching for printers...');
    
    // Placeholder for SDK discovery implementation
    // In production, this would use Brother SDK's discovery functionality
    
    // Return mock data for testing
    const mockPrinters: Device[] = [];
    
    // If we have a configured printer, include it in the results
    if (this.config) {
      mockPrinters.push({
        modelName: this.config.model,
        ipAddress: this.config.address,
        serialNumber: this.config.serialNumber,
        macAddress: this.config.macAddress
      });
    }
    
    return mockPrinters;
  }

  /**
   * Connect to a printer
   */
  static async connectToPrinter(address: string, model: string = 'Brother QL-820NWB', serialNumber?: string): Promise<boolean> {
    try {
      console.log(`[BrotherPrinterService] Connecting to printer at ${address}`);
      
      // Create a printer object
      this.currentPrinter = {
        modelName: model,
        ipAddress: address,
        serialNumber: serialNumber || '',
      };
      
      // Save the configuration
      await this.saveConfig({
        address,
        model,
        serialNumber,
        paperSize: this.config?.paperSize || '29mm',
      });
      
      this.status = PrinterStatus.CONNECTED;
      return true;
    } catch (error) {
      this.lastError = `Failed to connect: ${error}`;
      console.error('[BrotherPrinterService] Connection error:', error);
      return false;
    }
  }

  /**
   * Get label size enum value based on string size
   */
  private static getLabelSizeValue(size: string): LabelSize {
    switch(size) {
      case '29mm': return LabelSize.LabelSizeRollW29;
      case '38mm': return LabelSize.LabelSizeRollW38;
      case '50mm': return LabelSize.LabelSizeRollW50;
      case '54mm': return LabelSize.LabelSizeRollW54;
      case '62mm': return LabelSize.LabelSizeRollW62;
      default: return LabelSize.LabelSizeRollW29; // Default to 29mm
    }
  }

  /**
   * Create a minimal test image for printer testing
   */
  private static async createTestImage(): Promise<string> {
    // Pre-generated blank white PNG with a black border
    const testPngBase64 =
      'iVBORw0KGgoAAAANSUhEUgAAAP8AAABkCAYAAACJxwZPAAAAAXNSR0IArs4c6QAAAERlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAAA/6ADAAQAAAABAAAAZAAAAADuPVlXAAABWklEQVR4Ae3TQQ0AIRAEwcMhCMEBQvDvhQTIYKZqge0j2bMzZ+y9P48AAQJRgSXvEidAgMCXwPEPAQGBsIDxh8OXToDA8c8AAYGwgPGHw5dOgMDxzwABgbCA8YfDl06AwPHPAAGBsIDxh8OXToDA8c8AAYGwgPGHw5dOgMDxzwABgbCA8YfDl06AwPHPAAGBsIDxh8OXToDA8c8AAYGwgPGHw5dOgMDxzwABgbCA8YfDl06AwPHPAAGBsIDxh8OXToDA8c8AAYGwgPGHw5dOgMDxzwABgbCA8YfDl06AwPHPAAGBsIDxh8OXToDA8c8AAYGwgPGHw5dOgMDxzwABgbCA8YfDl06AwPHPAAGBsIDxh8OXToDA8c8AAYGwgPGHw5dOgMDxzwABgbCA8YfDl06AwPHPAAGBsIDxh8OXToDA8c8AAYGwgPGHw5dOgMDxzwABgbDAC3PQA/9zUYZoAAAAAElFTkSuQmCC';
    
    const tempFile = `${FileSystem.cacheDirectory}test_${Date.now()}.png`;
    await FileSystem.writeAsStringAsync(tempFile, testPngBase64, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return tempFile;
  }

  /**
   * Print a test label
   */
  static async printTestLabel(): Promise<boolean> {
    try {
      console.log('[BrotherPrinterService] Starting test print');
      
      // Make sure we have a printer configured
      if (!this.currentPrinter) {
        if (!this.config || !this.config.address) {
          throw new Error('No printer configured');
        }
        
        // Create a printer object from saved config
        this.currentPrinter = {
          modelName: this.config.model,
          ipAddress: this.config.address,
          serialNumber: this.config.serialNumber || '',
        };
      }
      
      // Create a test image
      const testImagePath = await this.createTestImage();
      console.log('[BrotherPrinterService] Created test image at:', testImagePath);
      
      // Print the test image
      return await this.printLabel(testImagePath);
    } catch (error) {
      this.lastError = `Failed to print test label: ${error}`;
      console.error('[BrotherPrinterService] Test print error:', error);
      return false;
    }
  }

  /**
   * Print a label image (simulated for this implementation)
   */
  static async printLabel(uri: string): Promise<boolean> {
    try {
      console.log('[BrotherPrinterService] Printing label:', uri);
      
      // Make sure we have a printer configured
      if (!this.currentPrinter) {
        if (!this.config || !this.config.address) {
          throw new Error('No printer configured');
        }
        
        // Create a printer object from saved config
        this.currentPrinter = {
          modelName: this.config.model,
          ipAddress: this.config.address,
          serialNumber: this.config.serialNumber || '',
        };
      }
      
      // Only allow PNG/JPG images for Brother print jobs
      const isImageFile = uri.toLowerCase().endsWith('.png') || uri.toLowerCase().endsWith('.jpg') || uri.toLowerCase().endsWith('.jpeg');
      if (!isImageFile) {
        throw new Error('Brother printers only support PNG or JPG images for printing.');
      }

      // Use correct label size mapping
      const labelSize = this.getLabelSizeValue(this.config?.paperSize || '29mm');

      // Simplified print options
      const printOptions: PrintOptions = {
        labelSize: labelSize,
        isHighQuality: false, // Always use standard quality for better compatibility
      };
      
      console.log('[BrotherPrinterService] Print options:', JSON.stringify(printOptions));
      
      // This is a simulated print - in actual implementation, you'd call the Brother SDK
      console.log(`[BrotherPrinterService] Simulating print to ${this.currentPrinter.ipAddress} with options:`, printOptions);
      
      // Simulate print delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // For testing purposes, assume printing was successful
      console.log('[BrotherPrinterService] Print successful (simulated)');
      return true;
    } catch (error) {
      this.lastError = `Failed to print label: ${error}`;
      this.status = PrinterStatus.ERROR;
      console.error('[BrotherPrinterService] Print error:', error);
      return false;
    }
  }
  
  /**
   * Print an HTML file as labels 
   * This is a simulated implementation - actual implementation would require HTML rendering
   */
  static async printHtml(htmlFilePath: string): Promise<boolean> {
    try {
      console.log('[BrotherPrinterService] Printing HTML file:', htmlFilePath);
      
      // Make sure we have a printer configured
      if (!this.currentPrinter) {
        if (!this.config || !this.config.address) {
          throw new Error('No printer configured');
        }
        
        // Create a printer object from saved config
        this.currentPrinter = {
          modelName: this.config.model,
          ipAddress: this.config.address,
          serialNumber: this.config.serialNumber || '',
        };
      }
      
      // Read HTML content
      const htmlContent = await FileSystem.readAsStringAsync(htmlFilePath);
      const contentPreview = htmlContent.substring(0, 100) + '...';
      console.log('[BrotherPrinterService] HTML content preview:', contentPreview);
      
      // Simulate HTML rendering and printing
      console.log('[BrotherPrinterService] Simulating HTML print to Brother printer');
      
      // Simulate print delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For testing purposes, assume printing was successful
      console.log('[BrotherPrinterService] HTML print successful (simulated)');
      return true;
    } catch (error) {
      this.lastError = `Failed to print HTML: ${error}`;
      this.status = PrinterStatus.ERROR;
      console.error('[BrotherPrinterService] HTML print error:', error);
      return false;
    }
  }
  
  /**
   * Disconnect from the printer
   */
  static disconnect(): void {
    this.currentPrinter = null;
    this.status = PrinterStatus.DISCONNECTED;
    console.log('[BrotherPrinterService] Disconnected from printer');
  }
}

export default BrotherPrinterService;