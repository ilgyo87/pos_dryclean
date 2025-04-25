import React, { useState, useEffect } from 'react';
import { Alert, Platform } from 'react-native';
import * as Print from 'expo-print';
import { requestBluetoothPermissions } from './PermissionHandler';
import { BluetoothManager } from 'react-native-bluetooth-escpos-printer';
import { ThermalPrinterModule } from 'react-native-thermal-receipt-printer';
import { Product } from '../types';
import { generateQRCodeData } from './QRCodeGenerator';

/**
 * Function to print QR codes to Phomemo M120 printer
 */
export const printToPhomemoM120 = async (
  items: Product[],
  customerName: string,
  orderId: string,
  printerOptions: Record<string, any> = {}
): Promise<boolean> => {
  try {
    // Check if we're on a native platform (not web)
    if (Platform.OS === 'web') {
      // Web doesn't support direct Bluetooth - fall back to Expo Print
      return printWithExpoPrint(items, customerName, orderId);
    }
    
    // For native platforms, request necessary permissions and use Bluetooth printing
    const hasPermissions = await requestBluetoothPermissions();
    if (!hasPermissions) {
      return false;
    }
    const isPrinterConnected = await checkAndConnectPrinter();
    
    if (!isPrinterConnected) {
      Alert.alert(
        'Printer Not Connected',
        'Please make sure your Phomemo M120 printer is turned on and paired with this device.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Try Again', 
            onPress: () => printToPhomemoM120(items, customerName, orderId, printerOptions) 
          },
        ]
      );
      return false;
    }
    
    // Generate content for each item
    for (const item of items) {
      // Generate QR code data
      const qrData = generateQRCodeData('Product', {
        id: item._id,
        orderItemId: item.orderItemId || item._id,
        orderId: item.orderId || '',
        customerId: item.customerId || '',
        businessId: item.businessId || '',
      });
      
      // Format for thermal printer
      await ThermalPrinterModule.printQRCode(
        {
          // QR code settings for Phomemo
          value: qrData,
          size: 10, // Size of QR code (1-16)
          align: 'center',
        }
      );
      
      // Print text content
      await ThermalPrinterModule.printText(
        `\n${customerName || 'Customer'}\n${item.name || 'Item'}\n\n`
      );
      
      // Add a cut command between items
      await ThermalPrinterModule.printCut();
    }
    
    return true;
  } catch (error) {
    console.error('Phomemo print error:', error);
    Alert.alert('Print Error', 'Failed to print to Phomemo M120. Make sure it is connected.');
    return false;
  }
};

/**
 * Check if printer is connected and connect if needed
 */
const checkAndConnectPrinter = async (): Promise<boolean> => {
  try {
    // Get the list of paired devices
    const devices = await BluetoothManager.enableBluetooth();
    
    // Find the Phomemo printer in the list
    const phomemoPrinter = devices.find(device => 
      device.name.includes('Phomemo') || 
      device.name.includes('M120')
    );
    
    if (!phomemoPrinter) {
      Alert.alert(
        'Printer Not Found',
        'Please pair your Phomemo M120 printer in your device Bluetooth settings first.'
      );
      return false;
    }
    
    // Connect to the printer
    await BluetoothManager.connect(phomemoPrinter.address);
    
    // Initialize the printer in ThermalPrinterModule
    await ThermalPrinterModule.init({
      type: 'bluetooth',
      macAddress: phomemoPrinter.address,
      interface: phomemoPrinter.address,
    });
    
    return true;
  } catch (error) {
    console.error('Printer connection error:', error);
    return false;
  }
};

/**
 * Fallback to Expo Print when Bluetooth isn't available
 */
const printWithExpoPrint = async (items: Product[], customerName: string, orderId: string): Promise<boolean> => {
  try {
    // Generate HTML with QR codes
    const html = generateQRCodesHTML(items, customerName, orderId);
    
    // Print using Expo Print
    const { uri } = await Print.printToFileAsync({ html });
    await Print.printAsync({
      uri,
    });
    
    return true;
  } catch (error) {
    console.error('Expo Print error:', error);
    Alert.alert('Print Error', 'There was an error printing the QR codes.');
    return false;
  }
};

/**
 * Generate HTML for QR codes (same as your existing function)
 */
export const generateQRCodesHTML = (items: Product[], customerName: string, orderId: string): string => {
  // Same HTML generation code as in your OrdersScreen
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
      <div class="order-header">Order #${orderId.substring(0, 8)}</div>
  `;

  // Generate HTML for each item with proper page breaks
  items.forEach((item, index) => {
    // Generate QR code data 
    const qrData = generateQRCodeData('Product', {
      id: item._id,
      orderItemId: item.orderItemId || item._id,
      orderId: item.orderId || '',
      customerId: item.customerId || '',
      businessId: item.businessId || '',
    });

    // Encode the data for use in a QR code
    const encodedData = encodeURIComponent(qrData);
    
    // Use a QR code generation service
    const qrCodeUrl = `https://chart.googleapis.com/chart?cht=qr&chs=300x300&chld=M|0&chl=${encodedData}`;

    // Add item container with improved thermal printer formatting
    html += `
      <div class="item-container">
        <img src="${qrCodeUrl}" class="qr-code" />
        <div class="item-details">
          <div class="customer-name">${customerName || 'Customer'}</div>
          <div class="item-name">${item.name || 'Item'}</div>
          ${item.starch ? `<div class="item-options">Starch: ${item.starch}</div>` : ''}
          ${item.pressOnly ? `<div class="item-options">Press Only</div>` : ''}
          <div class="item-id">${item._id.substring(0, 8)}</div>
        </div>
      </div>
      ${index < items.length - 1 ? '<div class="page-break"></div>' : ''}
    `;
  });

  // Close HTML with current date timestamp for tracking
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
};

// Import this function in your OrdersScreen.tsx and replace the printQRCodes function