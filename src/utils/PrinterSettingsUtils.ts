import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const PRINTER_SETTINGS_KEY = 'PRINTER_SETTINGS';
const DEFAULT_PRINTER_KEY = 'DEFAULT_PRINTER';
const PRINTER_HISTORY_KEY = 'PRINTER_HISTORY';

// Type definitions for printer settings and devices
export interface PrinterSettings {
  paperWidth: number;
  paperHeight: number;
  fontSize: number;
  autoConnect: boolean;
  printDensity: 'low' | 'medium' | 'high';
  cutPaper: boolean;
  printLogo: boolean;
  printQRSize: number;
  printQRAlignment: 'left' | 'center' | 'right';
  printSpeed: 'slow' | 'medium' | 'fast';
}

export interface PrinterDevice {
  name: string;
  address: string;
  lastConnected?: string;
}

export interface ReceiptItem {
  _id?: string;
  orderItemId?: string;
  customerId?: string;
  businessId?: string;
  name: string;
  options?: Record<string, any>;
  price?: number;
}

export interface ReceiptData {
  businessName?: string;
  orderNumber?: string;
  customerName?: string;
  items?: ReceiptItem[];
  total?: number;
  date?: string;
  notes?: string;
}

/**
 * Save printer settings to async storage
 * @param {PrinterSettings} settings - Printer settings object
 * @returns {Promise<void>}
 */
export const savePrinterSettings = async (settings: PrinterSettings): Promise<void> => {
  try {
    const jsonValue = JSON.stringify(settings);
    await AsyncStorage.setItem(PRINTER_SETTINGS_KEY, jsonValue);
  } catch (error) {
    console.error('Error saving printer settings:', error);
    throw error;
  }
};

/**
 * Get printer settings from async storage
 * @returns {Promise<PrinterSettings>} - Printer settings object
 */
export const getPrinterSettings = async (): Promise<PrinterSettings> => {
  try {
    const jsonValue = await AsyncStorage.getItem(PRINTER_SETTINGS_KEY);
    return jsonValue !== null ? JSON.parse(jsonValue) : getDefaultPrinterSettings();
  } catch (error) {
    console.error('Error getting printer settings:', error);
    return getDefaultPrinterSettings();
  }
};

/**
 * Get default printer settings
 * @returns {PrinterSettings} - Default printer settings
 */
export const getDefaultPrinterSettings = (): PrinterSettings => {
  return {
    paperWidth: 58, // mm (common for Phomemo M120)
    paperHeight: 40, // mm
    fontSize: 12,
    autoConnect: true,
    printDensity: 'medium', // low, medium, high
    cutPaper: true,
    printLogo: false,
    printQRSize: 8, // 1-16
    printQRAlignment: 'center',
    printSpeed: 'medium', // slow, medium, fast
  };
};

/**
 * Save default printer to async storage
 * @param {PrinterDevice} printer - Printer object with name, address, etc.
 * @returns {Promise<void>}
 */
export const saveDefaultPrinter = async (printer: PrinterDevice): Promise<void> => {
  try {
    const jsonValue = JSON.stringify(printer);
    await AsyncStorage.setItem(DEFAULT_PRINTER_KEY, jsonValue);
    
    // Also add to printer history
    await addPrinterToHistory(printer);
  } catch (error) {
    console.error('Error saving default printer:', error);
    throw error;
  }
};

/**
 * Get default printer from async storage
 * @returns {Promise<PrinterDevice | null>} - Default printer object or null
 */
export const getDefaultPrinter = async (): Promise<PrinterDevice | null> => {
  try {
    const jsonValue = await AsyncStorage.getItem(DEFAULT_PRINTER_KEY);
    return jsonValue !== null ? JSON.parse(jsonValue) : null;
  } catch (error) {
    console.error('Error getting default printer:', error);
    return null;
  }
};

/**
 * Add a printer to history
 * @param {PrinterDevice} printer - Printer object with name, address, etc.
 * @returns {Promise<void>}
 */
export const addPrinterToHistory = async (printer: PrinterDevice): Promise<void> => {
  try {
    // Get current history
    const history = await getPrinterHistory();
    
    // Check if printer already exists in history
    const existingIndex = history.findIndex(p => p.address === printer.address);
    
    if (existingIndex >= 0) {
      // Update existing printer with latest info and move to top
      history.splice(existingIndex, 1);
    }
    
    // Add printer to beginning of history
    history.unshift({
      ...printer,
      lastConnected: new Date().toISOString(),
    });
    
    // Limit history to last 5 printers
    const limitedHistory = history.slice(0, 5);
    
    // Save updated history
    const jsonValue = JSON.stringify(limitedHistory);
    await AsyncStorage.setItem(PRINTER_HISTORY_KEY, jsonValue);
  } catch (error) {
    console.error('Error adding printer to history:', error);
    throw error;
  }
};

/**
 * Get printer history from async storage
 * @returns {Promise<PrinterDevice[]>} - Array of printer objects
 */
export const getPrinterHistory = async (): Promise<PrinterDevice[]> => {
  try {
    const jsonValue = await AsyncStorage.getItem(PRINTER_HISTORY_KEY);
    return jsonValue !== null ? JSON.parse(jsonValue) : [];
  } catch (error) {
    console.error('Error getting printer history:', error);
    return [];
  }
};

/**
 * Format receipt text for Phomemo M120 printer
 * @param {ReceiptData} receiptData - Data to print on receipt
 * @returns {string} - Formatted text
 */
export const formatReceiptForPhomemo = (receiptData: ReceiptData): string => {
  const { 
    businessName, 
    orderNumber, 
    customerName, 
    items, 
    total, 
    date,
    notes 
  } = receiptData;
  
  // Get current date if not provided
  const printDate = date || new Date().toLocaleString();
  
  // Start with header
  let receiptText = '\n';
  
  // Business name centered
  if (businessName) {
    receiptText += `${centerText(businessName.toUpperCase())}\n\n`;
  }
  
  // Order number and date
  receiptText += `Order: #${orderNumber || 'N/A'}\n`;
  receiptText += `Date: ${printDate}\n`;
  
  // Customer info if available
  if (customerName) {
    receiptText += `Customer: ${customerName}\n`;
  }
  
  // Separator
  receiptText += `${'-'.repeat(32)}\n`;
  
  // Items
  if (items && items.length > 0) {
    items.forEach(item => {
      // Item name
      receiptText += `${item.name}\n`;
      
      // Item options if available
      if (item.options) {
        Object.entries(item.options).forEach(([key, value]) => {
          receiptText += `  ${key}: ${value}\n`;
        });
      }
      
      // Price aligned right
      if (item.price) {
        receiptText += `${alignRight('$' + item.price.toFixed(2))}\n`;
      }
      
      receiptText += `\n`;
    });
  }
  
  // Separator
  receiptText += `${'-'.repeat(32)}\n`;
  
  // Total
  if (total) {
    receiptText += `${alignRight('Total: $' + total.toFixed(2))}\n\n`;
  }
  
  // Notes
  if (notes) {
    receiptText += `Notes: ${notes}\n\n`;
  }
  
  // Footer
  receiptText += `${centerText('Thank You!')}\n\n\n`;
  
  return receiptText;
};

// Helper function to center text
const centerText = (text: string, width: number = 32): string => {
  const padding = Math.max(0, width - text.length) / 2;
  return ' '.repeat(Math.floor(padding)) + text;
};

// Helper function to align text right
const alignRight = (text: string, width: number = 32): string => {
  const padding = Math.max(0, width - text.length);
  return ' '.repeat(padding) + text;
};

export default {
  savePrinterSettings,
  getPrinterSettings,
  getDefaultPrinterSettings,
  saveDefaultPrinter,
  getDefaultPrinter,
  addPrinterToHistory,
  getPrinterHistory,
  formatReceiptForPhomemo,
};