import { Alert, Platform } from 'react-native';
import { BluetoothManager, BluetoothDevice } from 'react-native-bluetooth-escpos-printer';
import { ThermalPrinterModule } from 'react-native-thermal-receipt-printer';
import * as Print from 'expo-print';
import { requestBluetoothPermissions } from './PermissionHandler';
import PrinterSettingsAPI from './PrinterSettingsUtils';
import type { PrinterSettings as PrinterSettingsType, PrinterDevice, ReceiptData, ReceiptItem } from './PrinterSettingsUtils';

/**
 * Phomemo M120 Integration for POS apps
 */
class PhomemoIntegration {
  private isConnected: boolean = false;
  private currentPrinter: PrinterDevice | null = null;
  private settings!: PrinterSettingsType;

  /**
   * Initialize the integration
   */
  async init() {
    try {
      // Load saved settings
      this.settings = await PrinterSettingsAPI.getPrinterSettings();
      
      // Get default printer if auto-connect is enabled
      if (this.settings.autoConnect) {
        const defaultPrinter = await PrinterSettingsAPI.getDefaultPrinter();
        
        if (defaultPrinter) {
          // Check if Bluetooth is enabled before trying to connect
          const isBluetoothEnabled = await BluetoothManager.isBluetoothEnabled();
          
          if (isBluetoothEnabled) {
            await this.connectToPrinter(defaultPrinter);
          }
        }
      }
    } catch (error) {
      console.error('Phomemo Integration init error:', error);
    }
  }
  
  /**
   * Check if the app has Bluetooth permissions
   * @returns {Promise<boolean>}
   */
  async checkPermissions(): Promise<boolean> {
    return await requestBluetoothPermissions();
  }
  
  /**
   * Check if Bluetooth is enabled
   * @returns {Promise<boolean>}
   */
  async isBluetoothEnabled(): Promise<boolean> {
    try {
      return await BluetoothManager.isBluetoothEnabled();
    } catch (error) {
      console.error('Bluetooth check error:', error);
      return false;
    }
  }
  
  /**
   * Enable Bluetooth
   * @returns {Promise<BluetoothDevice[]>} - Array of paired devices
   */
  async enableBluetooth(): Promise<BluetoothDevice[]> {
    try {
      // First check permissions
      const hasPermissions = await this.checkPermissions();
      
      if (!hasPermissions) {
        throw new Error('Bluetooth permissions not granted');
      }
      
      return await BluetoothManager.enableBluetooth();
    } catch (error) {
      console.error('Enable Bluetooth error:', error);
      throw error;
    }
  }
  
  /**
   * Get paired Bluetooth devices
   * @returns {Promise<BluetoothDevice[]>} - Array of paired devices
   */
  async getPairedDevices(): Promise<BluetoothDevice[]> {
    try {
      // First check permissions
      const hasPermissions = await this.checkPermissions();
      
      if (!hasPermissions) {
        throw new Error('Bluetooth permissions not granted');
      }
      
      return await BluetoothManager.getBondedDevices();
    } catch (error) {
      console.error('Get paired devices error:', error);
      throw error;
    }
  }
  
  /**
   * Connect to a printer
   * @param {Object} printer - Printer object with address and name
   * @returns {Promise<boolean>} - Whether connection was successful
   */
  async connectToPrinter(printer: PrinterDevice): Promise<boolean> {
    try {
      // First check permissions
      const hasPermissions = await this.checkPermissions();
      
      if (!hasPermissions) {
        throw new Error('Bluetooth permissions not granted');
      }
      
      // Check if Bluetooth is enabled
      const isEnabled = await this.isBluetoothEnabled();
      
      if (!isEnabled) {
        await this.enableBluetooth();
      }
      
      // Connect to the printer
      await BluetoothManager.connect(printer.address);
      
      // Initialize the printer in ThermalPrinterModule
      await ThermalPrinterModule.init({
        type: 'bluetooth',
        macAddress: printer.address,
        interface: printer.address,
      });
      
      // Update current printer and connection status
      this.currentPrinter = printer;
      this.isConnected = true;
      
      // Save as default printer
      await PrinterSettingsAPI.saveDefaultPrinter(printer);
      
      return true;
    } catch (error) {
      console.error('Printer connection error:', error);
      this.isConnected = false;
      this.currentPrinter = null;
      throw error;
    }
  }
  
  /**
   * Print QR codes
   * @param {Array} items - Array of items to print QR codes for
   * @param {string} customerName - Customer name
   * @param {string} orderId - Order ID
   * @returns {Promise<boolean>} - Whether printing was successful
   */
  async printQRCodes(items: ReceiptItem[], customerName: string, orderId: string): Promise<boolean> {
    try {
      // Check if we're on a native platform (not web)
      if (Platform.OS === 'web') {
        // Web doesn't support direct Bluetooth - fall back to Expo Print
        return this.printWithExpoPrint(items, customerName, orderId);
      }
      
      // For native platforms, check if printer is connected
      if (!this.isConnected) {
        const defaultPrinter = await PrinterSettingsAPI.getDefaultPrinter();
        
        if (defaultPrinter) {
          try {
            await this.connectToPrinter(defaultPrinter);
          } catch (error) {
            // If connection fails, show printer selection dialog
            const shouldTryAgain = await new Promise((resolve) => {
              Alert.alert(
                'Printer Not Connected',
                'Would you like to select a printer?',
                [
                  { text: 'Cancel', onPress: () => resolve(false) },
                  { text: 'Select Printer', onPress: () => resolve(true) }
                ]
              );
            });
            
            if (shouldTryAgain) {
              // Show printer selection screen (implementation depends on your navigation)
              return false;
            } else {
              throw new Error('Printer not connected');
            }
          }
        } else {
          throw new Error('No default printer set');
        }
      }
      
      // Generate content for each item
      for (const item of items) {
        // Generate QR code data
        const qrData = this.generateQRCodeData(item, orderId, customerName);
        
        // Format for thermal printer
        await ThermalPrinterModule.printQRCode(
          {
            // QR code settings for Phomemo
            value: qrData,
            size: this.settings.printQRSize || 8, // Size of QR code (1-16)
            align: this.settings.printQRAlignment || 'center',
          }
        );
        
        // Print text content
        await ThermalPrinterModule.printText(
          `\n${customerName || 'Customer'}\n${item.name || 'Item'}\n\n`
        );
        
        // Add item details if available
        if (item.options) {
          let optionsText = '';
          Object.entries(item.options).forEach(([key, value]) => {
            optionsText += `${key}: ${value}\n`;
          });
          
          if (optionsText) {
            await ThermalPrinterModule.printText(optionsText + '\n');
          }
        }
        
        // Add a cut command between items if setting is enabled
        if (this.settings.cutPaper) {
          await ThermalPrinterModule.printCut();
        } else {
          // Add spacing between items
          await ThermalPrinterModule.printText('\n\n\n\n\n');
        }
      }
      
      return true;
    } catch (error) {
      console.error('QR code print error:', error);
      Alert.alert('Print Error', 'Failed to print QR codes: ' + (error as Error).message);
      return false;
    }
  }
  
  /**
   * Print a receipt
   * @param {Object} receiptData - Receipt data
   * @returns {Promise<boolean>} - Whether printing was successful
   */
  async printReceipt(receiptData: ReceiptData): Promise<boolean> {
    try {
      // Check if we're on a native platform (not web)
      if (Platform.OS === 'web') {
        // Web doesn't support direct Bluetooth - fall back to Expo Print
        return this.printReceiptWithExpoPrint(receiptData);
      }
      
      // For native platforms, check if printer is connected
      if (!this.isConnected) {
        const defaultPrinter = await PrinterSettingsAPI.getDefaultPrinter();
        
        if (defaultPrinter) {
          try {
            await this.connectToPrinter(defaultPrinter);
          } catch (error) {
            throw new Error('Failed to connect to printer: ' + (error as Error).message);
          }
        } else {
          throw new Error('No default printer set');
        }
      }
      
      // Format receipt for Phomemo
      const formattedText = PrinterSettingsAPI.formatReceiptForPhomemo(receiptData);
      
      // Print the receipt
      await ThermalPrinterModule.printText(formattedText);
      
      // Add a cut command if setting is enabled
      if (this.settings.cutPaper) {
        await ThermalPrinterModule.printCut();
      }
      
      return true;
    } catch (error) {
      console.error('Receipt print error:', error);
      Alert.alert('Print Error', 'Failed to print receipt: ' + (error as Error).message);
      return false;
    }
  }
  
  /**
   * Generate QR code data
   * @param {Object} item - Item data
   * @param {string} orderId - Order ID
   * @param {string} customerName - Customer name
   * @returns {string} - QR code data
   */
  generateQRCodeData(item: ReceiptItem, orderId: string, customerName: string): string {
    // Create a data object for the QR code
    const data = {
      type: 'Product',
      id: item._id,
      orderItemId: item.orderItemId || item._id,
      orderId: orderId || '',
      customerId: item.customerId || '',
      businessId: item.businessId || '',
      customerName: customerName || '',
      name: item.name || '',
      timestamp: new Date().toISOString()
    };
    
    // Convert to JSON string
    return JSON.stringify(data);
  }
  
  /**
   * Print with Expo Print (fallback for web)
   * @param {Array} items - Array of items
   * @param {string} customerName - Customer name
   * @param {string} orderId - Order ID
   * @returns {Promise<boolean>} - Whether printing was successful
   */
  async printWithExpoPrint(items: ReceiptItem[], customerName: string, orderId: string): Promise<boolean> {
    try {
      // Generate HTML for Expo Print
      const html = this.generatePrintHTML(items, customerName, orderId);
      
      // Print using Expo Print
      const { uri } = await Print.printToFileAsync({ html });
      await Print.printAsync({
        uri,
      });
      
      return true;
    } catch (error) {
      console.error('Expo Print error:', error);
      Alert.alert('Print Error', 'There was an error printing: ' +  (error as Error).message);
      return false;
    }
  }
  
  /**
   * Generate HTML for printing QR codes
   * @param {Array} items - Array of items
   * @param {string} customerName - Customer name
   * @param {string} orderId - Order ID
   * @returns {string} - HTML for printing
   */
  generatePrintHTML(items: ReceiptItem[], customerName: string, orderId: string): string {
    // Start with HTML header
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
        <style>
          @page {
            size: 58mm 40mm; /* Thermal label size for Phomemo M120 */
            margin: 0;
          }
          body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            padding: 5mm;
            margin: 0;
            width: 100%;
            box-sizing: border-box;
          }
          .page-break {
            page-break-after: always;
            height: 0;
          }
          .order-header {
            text-align: center;
            margin-bottom: 3mm;
            font-size: 3.5mm;
            font-weight: bold;
          }
          .item-container {
            border: 0.3mm solid #ccc;
            border-radius: 2mm;
            padding: 3mm;
            margin-bottom: 3mm;
            display: flex;
            flex-direction: row;
            align-items: center;
          }
          .qr-code {
            width: 20mm;
            height: 20mm;
          }
          .item-details {
            margin-left: 3mm;
            flex: 1;
          }
          .customer-name {
            font-weight: bold;
            font-size: 3mm;
            margin-bottom: 1mm;
          }
          .item-name {
            font-size: 3mm;
            color: #007bff;
            font-weight: bold;
          }
          .item-options {
            font-size: 2.5mm;
            color: #666;
            margin-top: 1mm;
          }
          .item-id {
            font-size: 2mm;
            color: #999;
            margin-top: 1mm;
            font-family: monospace;
          }
        </style>
      </head>
      <body>
        <div class="order-header">Order #${orderId ? orderId.substring(0, 8) : 'N/A'}</div>
    `;
    
    // Generate HTML for each item with proper page breaks
    items.forEach((item, index) => {
      // Generate QR code data
      const qrData = this.generateQRCodeData(item, orderId, customerName);
      
      // Encode the data for use in a QR code
      const encodedData = encodeURIComponent(qrData);
      
      // Use a QR code generation service
      const qrCodeUrl = `https://chart.googleapis.com/chart?cht=qr&chs=300x300&chld=M|0&chl=${encodedData}`;
      
      // Add item container
      html += `
        <div class="item-container">
          <img src="${qrCodeUrl}" class="qr-code" />
          <div class="item-details">
            <div class="customer-name">${customerName || 'Customer'}</div>
            <div class="item-name">${item.name || 'Item'}</div>
            ${item.options ? Object.entries(item.options).map(([key, value]) => 
              `<div class="item-options">${key}: ${value}</div>`).join('') : ''}
            <div class="item-id">${item._id ? item._id.substring(0, 8) : 'N/A'}</div>
          </div>
        </div>
        ${index < items.length - 1 ? '<div class="page-break"></div>' : ''}
      `;
    });
    
    // Close HTML with timestamp
    const now = new Date();
    const timestamp = now.toLocaleString();
    
    html += `
      <div style="text-align: center; font-size: 2mm; color: #999; margin-top: 2mm;">
        ${timestamp}
      </div>
      </body>
      </html>
    `;
    
    return html;
  }
  
  /**
   * Print receipt with Expo Print (fallback for web)
   * @param {Object} receiptData - Receipt data
   * @returns {Promise<boolean>} - Whether printing was successful
   */
  async printReceiptWithExpoPrint(receiptData: ReceiptData): Promise<boolean> {
    try {
      // Generate HTML for receipt
      const html = this.generateReceiptHTML(receiptData);
      
      // Print using Expo Print
      const { uri } = await Print.printToFileAsync({ html });
      await Print.printAsync({
        uri,
      });
      
      return true;
    } catch (error) {
      console.error('Receipt print error:', error);
      Alert.alert('Print Error', 'There was an error printing receipt: ' + (error as Error).message);
      return false;
    }
  }
  
  /**
   * Generate HTML for printing receipt
   * @param {Object} receiptData - Receipt data
   * @returns {string} - HTML for printing
   */
  generateReceiptHTML(receiptData: ReceiptData): string {
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
    
    // Generate HTML header
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
        <style>
          @page {
            size: 58mm auto; /* Thermal receipt size for Phomemo M120 */
            margin: 0;
          }
          body {
            font-family: 'Courier New', monospace;
            padding: 5mm;
            margin: 0;
            width: 100%;
            box-sizing: border-box;
            font-size: 3mm;
          }
          .text-center {
            text-align: center;
          }
          .text-right {
            text-align: right;
          }
          .business-name {
            font-size: 4mm;
            font-weight: bold;
            text-transform: uppercase;
            margin-bottom: 3mm;
          }
          .separator {
            border-top: 0.2mm dashed #000;
            margin: 2mm 0;
          }
          .item {
            margin-bottom: 2mm;
          }
          .item-option {
            padding-left: 3mm;
            font-size: 2.5mm;
          }
          .item-price {
            text-align: right;
          }
          .total {
            font-weight: bold;
            margin-top: 2mm;
          }
          .notes {
            font-style: italic;
            margin-top: 2mm;
            font-size: 2.5mm;
          }
          .footer {
            margin-top: 4mm;
            font-size: 3mm;
            text-align: center;
          }
        </style>
      </head>
      <body>
    `;
    
    // Business name
    if (businessName) {
      html += `<div class="business-name text-center">${businessName}</div>`;
    }
    
    // Order details
    html += `<div>Order: #${orderNumber || 'N/A'}</div>`;
    html += `<div>Date: ${printDate}</div>`;
    
    // Customer info
    if (customerName) {
      html += `<div>Customer: ${customerName}</div>`;
    }
    
    // Separator
    html += `<div class="separator"></div>`;
    
    // Items
    if (items && items.length > 0) {
      items.forEach(item => {
        html += `<div class="item">`;
        
        // Item name
        html += `<div>${item.name || 'Item'}</div>`;
        
        // Item options
        if (item.options) {
          Object.entries(item.options).forEach(([key, value]) => {
            html += `<div class="item-option">${key}: ${value}</div>`;
          });
        }
        
        // Price
        if (item.price) {
          html += `<div class="item-price">${item.price.toFixed(2)}</div>`;
        }
        
        html += `</div>`;
      });
    }
    
    // Separator
    html += `<div class="separator"></div>`;
    
    // Total
    if (total) {
      html += `<div class="total text-right">Total: ${total.toFixed(2)}</div>`;
    }
    
    // Notes
    if (notes) {
      html += `<div class="notes">Notes: ${notes}</div>`;
    }
    
    // Footer
    html += `
      <div class="footer">Thank You!</div>
      <div class="text-center" style="font-size: 2mm; color: #666; margin-top: 4mm;">
        ${new Date().toLocaleString()}
      </div>
    `;
    
    // Close HTML
    html += `
      </body>
      </html>
    `;
    
    return html;
  }
}

// Create a singleton instance
const phomemoPrinter = new PhomemoIntegration();

export default phomemoPrinter;