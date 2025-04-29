// src/utils/PrinterService.ts
import { Alert, Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Print from 'expo-print';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage key for printer settings
const PRINTER_STORAGE_KEY = 'POS_DRYCLEAN_PRINTER_ADDRESS';

// Printer connection status enum
export enum PrinterConnectionStatus {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  ERROR = 'error'
}

// Printer device interface
export interface PrinterDevice {
  name: string;
  address: string;
  lastConnected?: string;
}

// Receipt data interface
export interface ReceiptData {
  businessName?: string;
  orderNumber?: string;
  customerName?: string;
  items?: ReceiptItem[];
  total?: number;
  date?: string;
  notes?: string;
}

// Receipt item interface
export interface ReceiptItem {
  name: string;
  price?: number;
  options?: Record<string, any>;
}

/**
 * Service for handling printing operations with thermal printers
 */
class PrinterService {
  private static connectionStatus: PrinterConnectionStatus = PrinterConnectionStatus.DISCONNECTED;
  private static lastError: string | null = null;
  private static selectedPrinter: PrinterDevice | null = null;

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

      // Initialize the printer
      if (this.selectedPrinter?.address) {
        this.connectionStatus = PrinterConnectionStatus.CONNECTED;
        return true;
      } else {
        this.lastError = 'No printer configured. Please set up a printer first.';
        this.connectionStatus = PrinterConnectionStatus.DISCONNECTED;
        return false;
      }
    } catch (error) {
      this.lastError = `Failed to initialize printer: ${error}`;
      this.connectionStatus = PrinterConnectionStatus.ERROR;
      console.error('Printer initialization error:', error);
      return false;
    }
  }

  /**
   * Load saved printer from AsyncStorage
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
   * Save printer to AsyncStorage
   */
  static async savePrinter(printer: PrinterDevice): Promise<void> {
    try {
      // Add timestamp
      const now = new Date().toISOString();
      const printerWithTimestamp = {
        ...printer,
        lastConnected: now
      };
      
      await AsyncStorage.setItem(PRINTER_STORAGE_KEY, JSON.stringify(printerWithTimestamp));
      this.selectedPrinter = printerWithTimestamp;
      this.connectionStatus = PrinterConnectionStatus.CONNECTED;
    } catch (error) {
      console.error('Error saving printer:', error);
      throw error;
    }
  }
  
  /**
   * Get current connection status
   */
  static getStatus(): { status: PrinterConnectionStatus; error: string | null; printer: PrinterDevice | null } {
    return {
      status: this.connectionStatus,
      error: this.lastError,
      printer: this.selectedPrinter
    };
  }

  /**
   * Print a QR code - implementation depends on the platform
   * @param data QR code data
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
      
      // Create QR code HTML
      const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
        <style>
          @page {
            size: 29mm 90mm;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 16px;
            text-align: center;
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
          }
          .qr-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
          }
          img {
            max-width: 200px;
            max-height: 200px;
          }
        </style>
      </head>
      <body>
        <div class="qr-container">
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data)}" alt="QR Code" />
        </div>
      </body>
      </html>`;
      
      // Use native print API to print the HTML
      return await this.printHTML(html);
    } catch (error) {
      this.lastError = `Failed to print QR code: ${error}`;
      console.error('QR code printing error:', error);
      return false;
    }
  }
  
  /**
   * Print an HTML document - this is a universal method used for various printing needs
   * @param html HTML content or file path to print
   */
  static async printHTML(html: string): Promise<boolean> {
    if (Platform.OS === 'web') {
      console.warn('HTML printing is not available on web platform');
      return false;
    }
    
    try {
      if (this.connectionStatus !== PrinterConnectionStatus.CONNECTED && this.selectedPrinter === null) {
        const initialized = await this.initialize();
        if (!initialized) {
          throw new Error('Printer not connected');
        }
      }
      
      // Check if html is a file path or actual HTML content
      let htmlContent = html;
      if (html.startsWith(FileSystem.cacheDirectory!) || html.startsWith(FileSystem.documentDirectory!)) {
        htmlContent = await FileSystem.readAsStringAsync(html);
      }
      
      // Use expo-print to handle the printing
      await Print.printAsync({
        html: htmlContent,
        printerUrl: this.selectedPrinter?.address
      });
      
      return true;
    } catch (error) {
      this.lastError = `Failed to print HTML: ${error}`;
      console.error('HTML printing error:', error);
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
    items: any[],
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
      
      // Build multi-page HTML for all labels
      let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
        <style>
          @page {
            size: 29mm 90mm;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
          }
          .label-page {
            width: 29mm;
            height: 90mm;
            page-break-after: always;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            align-items: center;
            padding: 4mm;
            box-sizing: border-box;
          }
          .product-name {
            font-size: 10pt;
            font-weight: bold;
            text-align: center;
            margin-bottom: 2mm;
          }
          .qr-code {
            display: flex;
            justify-content: center;
            margin: 2mm 0;
          }
          .customer-name {
            font-size: 9pt;
            font-weight: bold;
            text-align: center;
            margin-top: 2mm;
          }
          .order-id {
            font-size: 7pt;
            color: #666;
            margin-top: 1mm;
          }
        </style>
      </head>
      <body>`;
      
      // Add each item as a separate label page
      for (const item of items) {
        // Generate QR code data - simplified for example
        const qrData = JSON.stringify({
          id: item._id || item.id,
          orderId: orderId,
          customerId: item.customerId || '',
          businessId: item.businessId || '',
        });
        
        const encodedData = encodeURIComponent(qrData);
        
        html += `
        <div class="label-page">
          <div class="product-name">${item.name || 'No Product Name'}</div>
          <div class="qr-code">
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodedData}" alt="QR Code" width="150" height="150" />
          </div>
          <div class="customer-info">
            <div class="customer-name">${customerName || 'No Customer'}</div>
            <div class="order-id">Order #${orderId.substring(0, 8)}</div>
          </div>
        </div>`;
      }
      
      html += `
      </body>
      </html>`;
      
      // Print the complete HTML document
      return await this.printHTML(html);
    } catch (error) {
      this.lastError = `Failed to print QR codes: ${error}`;
      console.error('QR codes printing error:', error);
      return false;
    }
  }
  
  /**
   * Print a receipt with items, totals, etc.
   * @param receiptData Data to include in the receipt
   */
  static async printReceipt(receiptData: ReceiptData): Promise<boolean> {
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
      
      // Format receipt HTML
      const html = this.formatReceiptHTML(receiptData);
      
      // Print the HTML receipt
      return await this.printHTML(html);
    } catch (error) {
      this.lastError = `Failed to print receipt: ${error}`;
      console.error('Receipt printing error:', error);
      return false;
    }
  }
  
  /**
   * Format receipt data as HTML for printing
   * @param receiptData Receipt data to format
   */
  private static formatReceiptHTML(receiptData: ReceiptData): string {
    const { 
      businessName, 
      orderNumber, 
      customerName, 
      items = [], 
      total = 0, 
      date = new Date().toLocaleString(),
      notes
    } = receiptData;
    
    // Calculate column widths
    const descWidth = '70%';
    const priceWidth = '30%';
    
    let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
      <style>
        @page {
          margin: 5mm;
        }
        body {
          font-family: sans-serif;
          margin: 0;
          padding: 0;
          font-size: 10pt;
        }
        .receipt {
          width: 100%;
        }
        .header {
          text-align: center;
          margin-bottom: 10px;
        }
        .business-name {
          font-weight: bold;
          font-size: 14pt;
          text-transform: uppercase;
        }
        .info {
          margin-bottom: 10px;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 3px;
        }
        .separator {
          border-top: 1px dashed #000;
          margin: 5px 0;
        }
        .items {
          width: 100%;
        }
        .item-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 5px;
        }
        .item-name {
          width: ${descWidth};
        }
        .item-price {
          width: ${priceWidth};
          text-align: right;
        }
        .item-option {
          padding-left: 10px;
          font-style: italic;
          font-size: 9pt;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          font-weight: bold;
          margin-top: 5px;
        }
        .notes {
          margin-top: 10px;
          font-style: italic;
        }
        .footer {
          text-align: center;
          margin-top: 15px;
          font-size: 9pt;
        }
      </style>
    </head>
    <body>
      <div class="receipt">
        <div class="header">
          <div class="business-name">${businessName || 'Business Name'}</div>
        </div>
        
        <div class="info">
          <div class="info-row">
            <span>Order:</span>
            <span>${orderNumber || 'N/A'}</span>
          </div>
          <div class="info-row">
            <span>Date:</span>
            <span>${date}</span>
          </div>
          ${customerName ? `
          <div class="info-row">
            <span>Customer:</span>
            <span>${customerName}</span>
          </div>` : ''}
        </div>
        
        <div class="separator"></div>
        
        <div class="items">`;
    
    // Add each item
    items.forEach(item => {
      html += `
          <div class="item-row">
            <div class="item-name">${item.name}</div>
            <div class="item-price">${(item.price || 0).toFixed(2)}</div>
          </div>`;
      
      // Add options if available
      if (item.options) {
        Object.entries(item.options).forEach(([key, value]) => {
          // Skip if value is falsy or empty
          if (!value || (Array.isArray(value) && value.length === 0)) return;
          
          // Format the option
          const formattedOption = typeof value === 'boolean' 
            ? key 
            : `${key}: ${value}`;
          
          html += `
          <div class="item-row">
            <div class="item-name item-option">${formattedOption}</div>
            <div class="item-price"></div>
          </div>`;
        });
      }
    });
    
    // Add total and footer
    html += `
        </div>
        
        <div class="separator"></div>
        
        <div class="total-row">
          <span>TOTAL</span>
          <span>${total.toFixed(2)}</span>
        </div>
        
        ${notes ? `
        <div class="notes">
          ${notes}
        </div>` : ''}
        
        <div class="footer">
          Thank you for your business!
        </div>
      </div>
    </body>
    </html>`;
    
    return html;
  }
  
  /**
   * Disconnect from the printer
   */
  static async disconnect(): Promise<boolean> {
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