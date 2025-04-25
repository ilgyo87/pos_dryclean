// src/utils/PrinterService.ts
import { Alert, Platform } from 'react-native';
import * as Print from 'expo-print';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateQRCodeData } from './QRCodeGenerator';


// Define interfaces for our printer service
export interface PrinterDevice {
  name: string;
  address: string;
  inner_mac_address?: string; // For BLEPrinter compatibility
  lastConnected?: string;
}

export interface ReceiptItem {
  _id: string;
  orderItemId?: string;
  customerId?: string;
  businessId?: string;
  name: string;
  options?: {
    starch?: 'none' | 'light' | 'medium' | 'heavy';
    pressOnly?: boolean;
    notes?: string;
  };
  price?: number;
  imageName?: string;
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

// Constants for storage
const PRINTER_SETTINGS_KEY = 'PRINTER_SETTINGS';
const DEFAULT_PRINTER_KEY = 'DEFAULT_PRINTER';
const PRINTER_HISTORY_KEY = 'PRINTER_HISTORY';

class PrinterService {

  // Initialize the printer service
  async init() {
    // No-op for now. Will support future printer integrations.
    return true;
  }

  // Load printer history
  async getPrinterHistory(): Promise<PrinterDevice[]> {
    try {
      const historyJSON = await AsyncStorage.getItem(PRINTER_HISTORY_KEY);
      return historyJSON ? JSON.parse(historyJSON) : [];
    } catch (error: unknown) {
      if (error instanceof Error) {
  console.error('Error loading printer history:', error.message);
} else {
  console.error('Error loading printer history:', error);
}
      return [];
    }
  }

  // Print QR codes for order items
  async printQRCodes(items: ReceiptItem[], customerName: string, orderId: string): Promise<boolean> {
    try {
      if (items.length === 0) {
        Alert.alert('Print Error', 'No items to print');
        return false;
      }

      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        const { generateQRCodeData } = require('./QRCodeGenerator');
        const ThermalPrinterModule = require('react-native-thermal-receipt-printer').default;
        for (const item of items) {
          try {
            // Generate QR code data
            const qrCodeData = generateQRCodeData('Product', {
              id: item._id,
              orderItemId: item.orderItemId || item._id,
              orderId: orderId,
              customerId: item.customerId || '',
              businessId: item.businessId || '',
            });

            // Format options string
            let optionsStr = '';
            if (item.options) {
              if (item.options.starch) {
                optionsStr += `Starch: ${item.options.starch}\n`;
              }
              if (item.options.pressOnly) {
                optionsStr += `Press Only\n`;
              }
              if (item.options.notes) {
                optionsStr += `Notes: ${item.options.notes}\n`;
              }
            }

            // Print the QR code
            await ThermalPrinterModule.printQRCode({
              value: qrCodeData,
              size: 8,
              align: 'center'
            });

            // Print text
            await ThermalPrinterModule.printText(
              `\n${customerName || 'Customer'}\n${item.name}\n${optionsStr}\n\n`
            );

            // Cut the paper between items
            await ThermalPrinterModule.printCut();
          } catch (itemError: unknown) {
            if (itemError instanceof Error) {
              console.error('Error printing QR code for item:', item, itemError.message);
            } else {
              console.error('Error printing QR code for item:', item, itemError);
            }
            Alert.alert('Print Error', `Failed to print QR code for item: ${item.name || item._id}`);
          }
        }
        return true;
      }

      // For demo/development without a physical printer:
      // Use Expo Print as a fallback when in development or on web
      return this.printWithExpoPrint(items, customerName, orderId);
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Print error:', error.message);
      } else {
        console.error('Print error:', error);
      }
      // Instead of alerting, use the print preview as fallback
      console.log('Using print preview as fallback after error');
      return this.printWithExpoPrint(items, customerName, orderId);
    }
  }

  // Print a receipt
  async printReceipt(data: ReceiptData): Promise<boolean> {
    // For now, always use Expo Print fallback
    return this.printReceiptWithExpoPrint(data);
  }

  // Format receipt text for thermal printer
  private formatReceiptForPrinter(data: ReceiptData): string {
    const { 
      businessName, 
      orderNumber, 
      customerName, 
      items, 
      total, 
      date,
      notes 
    } = data;
    
    // Get current date if not provided
    const printDate = date || new Date().toLocaleString();
    
    // Start with header
    let receiptText = '\n';
    
    // Business name centered
    if (businessName) {
      receiptText += `${this.centerText(businessName.toUpperCase())}\n\n`;
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
          if (item.options.starch) {
            receiptText += `  Starch: ${item.options.starch}\n`;
          }
          if (item.options.pressOnly) {
            receiptText += `  Press Only\n`;
          }
          if (item.options.notes) {
            receiptText += `  Notes: ${item.options.notes}\n`;
          }
        }
        
        // Price aligned right
        if (item.price) {
          receiptText += `${this.alignRight('$' + item.price.toFixed(2))}\n`;
        }
        
        receiptText += `\n`;
      });
    }
    
    // Separator
    receiptText += `${'-'.repeat(32)}\n`;
    
    // Total
    if (total) {
      receiptText += `${this.alignRight('Total: $' + total.toFixed(2))}\n\n`;
    }
    
    // Notes
    if (notes) {
      receiptText += `Notes: ${notes}\n\n`;
    }
    
    // Footer
    receiptText += `${this.centerText('Thank You!')}\n\n\n`;
    
    return receiptText;
  }

  // Helper functions
  private centerText(text: string, width: number = 32): string {
    const padding = Math.max(0, width - text.length) / 2;
    return ' '.repeat(Math.floor(padding)) + text;
  }
  
  private alignRight(text: string, width: number = 32): string {
    const padding = Math.max(0, width - text.length);
    return ' '.repeat(padding) + text;
  }

  // Expo Print fallback methods for web platform
  private async printWithExpoPrint(items: ReceiptItem[], customerName: string, orderId: string): Promise<boolean> {
    try {
      // Generate HTML for Expo Print
      const html = this.generateQRCodesHTML(items, customerName, orderId);
      
      // Print using Expo Print
      const { uri } = await Print.printToFileAsync({ html });
      await Print.printAsync({ uri });
      
      return true;
    } catch (error: unknown) {
      if (error instanceof Error) {
  console.error('Expo Print error:', error.message);
} else {
  console.error('Expo Print error:', error);
}
      Alert.alert('Print Error', `There was an error printing: ${error}`);
      return false;
    }
  }
  
  private async printReceiptWithExpoPrint(data: ReceiptData): Promise<boolean> {
    try {
      // Generate HTML for receipt
      const html = this.generateReceiptHTML(data);
      
      // Print using Expo Print
      const { uri } = await Print.printToFileAsync({ html });
      await Print.printAsync({ uri });
      
      return true;
    } catch (error: unknown) {
      if (error instanceof Error) {
  console.error('Receipt print error:', error.message);
} else {
  console.error('Receipt print error:', error);
}
      Alert.alert('Print Error', `There was an error printing receipt: ${error}`);
      return false;
    }
  }
  
  private generateQRCodesHTML(items: ReceiptItem[], customerName: string, orderId: string): string {
    // Start with HTML header
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
        <style>
          @page {
            size: 58mm 40mm; /* Thermal label size */
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
      const qrData = generateQRCodeData('Product', {
        id: item._id,
        orderItemId: item.orderItemId || item._id,
        orderId: orderId,
        customerId: item.customerId || '',
        businessId: item.businessId || '',
      });
      
      // Encode the data for use in a QR code
      const encodedData = encodeURIComponent(qrData);
      
      // Use a QR code generation service
      const qrCodeUrl = `https://chart.googleapis.com/chart?cht=qr&chs=300x300&chld=M|0&chl=${encodedData}`;
      
      // Add item container with options
      let optionsHtml = '';
      if (item.options) {
        if (item.options.starch) {
          optionsHtml += `<div class="item-options">Starch: ${item.options.starch}</div>`;
        }
        if (item.options.pressOnly) {
          optionsHtml += `<div class="item-options">Press Only</div>`;
        }
        if (item.options.notes) {
          optionsHtml += `<div class="item-options">Notes: ${item.options.notes}</div>`;
        }
      }
      
      html += `
        <div class="item-container">
          <img src="${qrCodeUrl}" class="qr-code" />
          <div class="item-details">
            <div class="customer-name">${customerName || 'Customer'}</div>
            <div class="item-name">${item.name || 'Item'}</div>
            ${optionsHtml}
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
  
  private generateReceiptHTML(data: ReceiptData): string {
    const { 
      businessName, 
      orderNumber, 
      customerName, 
      items, 
      total, 
      date,
      notes 
    } = data;
    
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
            size: 58mm auto; /* Thermal receipt size */
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
          if (item.options.starch) {
            html += `<div class="item-option">Starch: ${item.options.starch}</div>`;
          }
          if (item.options.pressOnly) {
            html += `<div class="item-option">Press Only</div>`;
          }
          if (item.options.notes) {
            html += `<div class="item-option">Notes: ${item.options.notes}</div>`;
          }
        }
        
        // Price
        if (item.price) {
          html += `<div class="item-price">$${item.price.toFixed(2)}</div>`;
        }
        
        html += `</div>`;
      });
    }
    
    // Separator
    html += `<div class="separator"></div>`;
    
    // Total
    if (total) {
      html += `<div class="total text-right">Total: $${total.toFixed(2)}</div>`;
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

// Create singleton instance
const printerService = new PrinterService();
export default printerService;