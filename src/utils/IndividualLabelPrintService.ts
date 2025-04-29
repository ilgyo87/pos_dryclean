// src/utils/IndividualLabelPrintService.ts
// Service for printing QR code labels in 29x90mm format (vertical)

import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { captureRef } from 'react-native-view-shot';
import { Product } from '../types';

// Dynamic import to avoid circular dependencies
const getPrinterService = async () => {
  const module = await import('./PrinterService');
  return module.default;
};

/**
 * Configuration for label printing
 */
export interface LabelPrintConfig {
  paperSize: '29mm' | '38mm' | '50mm' | '54mm' | '62mm';
  labelLength: number; // in mm, for continuous paper
  margin: number; // in mm
  orientation: 'portrait' | 'landscape';
  continuousPrint: boolean; // whether to print all items in one job
}

/**
 * Default configuration for 29x90mm VERTICAL labels
 */
export const DEFAULT_29X90_CONFIG: LabelPrintConfig = {
  paperSize: '29mm',
  labelLength: 90, // 90mm length
  margin: 0, // Zero margin for maximum content size
  orientation: 'portrait', // IMPORTANT: Always use portrait for vertical labels
  continuousPrint: true // Enable continuous printing by default
};

/**
 * Service for printing QR code labels
 */
class IndividualLabelPrintService {
  private static config: LabelPrintConfig = DEFAULT_29X90_CONFIG;
  
  /**
   * Set configuration for label printing
   */
  static setConfig(config: Partial<LabelPrintConfig>): void {
    this.config = { ...this.config, ...config };
  }
  
  /**
   * Get current configuration
   */
  static getConfig(): LabelPrintConfig {
    return { ...this.config };
  }
  
  /**
   * Print QR code labels for multiple items
   * @param items Products to print QR codes for
   * @param customerName Customer name to include on labels
   * @param orderId Order ID to include on labels
   * @param viewShotRefs React refs to ViewShot components containing QR codes
   * @param onProgress Optional callback for progress updates
   */
  static async printIndividualLabels(
    items: Product[],
    customerName: string,
    orderId: string,
    viewShotRefs: React.RefObject<any>[],
    onProgress?: (current: number, total: number) => void
  ): Promise<boolean> {
    try {
      console.log('[IndividualLabelPrintService] Starting label printing for', items.length, 'items');
      
      if (items.length === 0) {
        console.warn('[IndividualLabelPrintService] No items to print');
        return false;
      }
      
      // If continuous printing is enabled, capture all labels at once
      if (this.config.continuousPrint) {
        return await this.printContinuousLabels(items, customerName, orderId, viewShotRefs, onProgress);
      } else {
        return await this.printSeparateLabels(items, customerName, orderId, viewShotRefs, onProgress);
      }
    } catch (error) {
      console.error('[IndividualLabelPrintService] Print error:', error);
      throw error;
    }
  }
  
  /**
   * Print all labels as a single continuous job
   */
  private static async printContinuousLabels(
    items: Product[],
    customerName: string,
    orderId: string,
    viewShotRefs: React.RefObject<any>[],
    onProgress?: (current: number, total: number) => void
  ): Promise<boolean> {
    console.log('[IndividualLabelPrintService] Using continuous printing for all labels');
    
    try {
      // First capture all label images
      const capturedImages: string[] = [];
      
      for (let i = 0; i < items.length; i++) {
        if (onProgress) {
          onProgress(i + 1, items.length * 2); // First half is capturing
        }
        
        const ref = viewShotRefs[i];
        if (!ref || !ref.current) {
          console.error(`[IndividualLabelPrintService] ViewShot ref not available for item ${i}`);
          continue;
        }
        
        try {
          // Capture QR code image with proper orientation and MUCH LARGER SIZE
          const imageUri = await captureRef(ref, { 
            format: 'png', 
            quality: 1.0,
            width: 2000, // Force extremely large capture width for high DPI printing
            height: 2000, // Force extremely large capture height
            result: 'tmpfile'
          });
          
          capturedImages.push(imageUri);
          console.log(`[IndividualLabelPrintService] Captured image for item ${i}`);
        } catch (err) {
          console.error(`[IndividualLabelPrintService] Error capturing image for item ${i}:`, err);
        }
      }
      
      if (capturedImages.length === 0) {
        console.error('[IndividualLabelPrintService] Failed to capture any images');
        return false;
      }
      
      // Now create a single HTML document with all labels for printing
      // Import expo-print dynamically
      const Print = await import('expo-print');
      
      // Build HTML for all labels with VERTICAL LAYOUT
      let htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=29mm, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
  <style>
    @page {
      margin: 0;
      padding: 0;
      size: 29mm ${this.config.labelLength}mm;
    }
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      background: white;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    }
    .label-page {
      width: 29mm;
      height: ${this.config.labelLength}mm;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      page-break-after: always;
      break-after: page;
      overflow: hidden;
      padding: 2mm;
      box-sizing: border-box;
    }
    .label-content {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: center;
    }
    .product-name {
      font-size: 12pt;
      font-weight: bold;
      text-align: center;
      margin-bottom: 2mm;
      width: 100%;
      line-height: 1.2;
    }
    .barcode-wrapper {
      width: 20mm;
      height: 20mm;
      display: flex;
      justify-content: center;
      align-items: center;
      margin: 2mm 0;
    }
    .barcode {
      max-width: 100%;
      max-height: 100%;
    }
    .customer-info {
      text-align: center;
      width: 100%;
      margin-top: 2mm;
    }
    .customer-name {
      font-size: 10pt;
      font-weight: bold;
      margin-bottom: 1mm;
    }
    .order-id {
      font-size: 8pt;
      color: #666;
    }
  </style>
</head>
<body>
      `;
      
      // Process each captured image to base64 and embed in HTML
      for (let idx = 0; idx < capturedImages.length; idx++) {
        const item = items[idx];
        
        // Read captured image as base64
        const base64 = await FileSystem.readAsStringAsync(capturedImages[idx], {
          encoding: FileSystem.EncodingType.Base64,
        });
        
        let productInfo = item.name || 'No Product Name';
        if (item.starch) productInfo += ` (${item.starch})`;
        if (item.pressOnly) productInfo += ' (Press Only)';
        
        htmlContent += `
<div class="label-page">
  <div class="label-content">
    <div class="product-name">${productInfo}</div>
    <div class="barcode-wrapper">
      <img class="barcode" src="data:image/png;base64,${base64}" alt="QR Code" />
    </div>
    <div class="customer-info">
      <div class="customer-name">${customerName || 'No Customer'}</div>
      <div class="order-id">#${orderId.substring(0, 8) || 'N/A'}</div>
    </div>
  </div>
</div>`;
      }
      
      // Close the HTML document
      htmlContent += `
</body>
</html>`;
      
      // Print using appropriate platform method
      if (Platform.OS === 'ios') {
        // For iOS, use AirPrint with portrait orientation
        await Print.printAsync({
          html: htmlContent,
          orientation: 'portrait', // Force portrait orientation for vertical labels
          printerUrl: undefined, // Let iOS select printer
        });
      } else {
        // For Android, save the HTML to a file and print it using Printer service
        const tempFile = `${FileSystem.cacheDirectory}labels_${Date.now()}.html`;
        await FileSystem.writeAsStringAsync(tempFile, htmlContent);
        
        // Get printer service
        const printerService = await getPrinterService();
        
        // Print the file
        const result = await printerService.printHTML(tempFile);
        
        // Clean up the temp file
        await FileSystem.deleteAsync(tempFile, { idempotent: true });
        
        if (!result) {
          throw new Error('Failed to print using printer service');
        }
      }
      
      console.log('[IndividualLabelPrintService] Successfully printed all labels');
      return true;
      
    } catch (error) {
      console.error('[IndividualLabelPrintService] Error in continuous printing:', error);
      throw error;
    }
  }
  
  /**
   * Print each label as a separate job (original method)
   * Uses AirPrint for iOS and PrinterService for Android
   */
  private static async printSeparateLabels(
    items: Product[],
    customerName: string,
    orderId: string,
    viewShotRefs: Array<React.RefObject<any>>,
    onProgress?: (current: number, total: number) => void
  ): Promise<boolean> {
    console.log('[IndividualLabelPrintService] Using separate print jobs for each label');
    
    // For iOS, use AirPrint
    if (Platform.OS === 'ios') {
      // Process each item individually
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        let progressCalled = false;
        try {
          // Report progress (before starting item)
          if (onProgress) {
            onProgress(i + 1, items.length);
            progressCalled = true;
          }
          // Get ViewShot ref for this item
          const ref = viewShotRefs[i];
          if (!ref || !ref.current) {
            console.error(`[IndividualLabelPrintService] ViewShot ref not available for item ${i}`);
            continue;
          }
          // Capture QR code image with MUCH LARGER SIZE for high DPI printing
          const imageUri = await captureRef(ref, { 
            format: 'png', 
            quality: 1.0,
            width: 2000, // Force extremely large capture width
            height: 2000, // Force extremely large capture height
            result: 'tmpfile'
          });
          
          console.log(`[IndividualLabelPrintService] Captured image for item ${i}:`, imageUri);
          
          // Import expo-print dynamically
          const Print = await import('expo-print');
          
          // Read the image as base64
          const base64 = await FileSystem.readAsStringAsync(imageUri, { 
            encoding: FileSystem.EncodingType.Base64 
          });
          
          // Use config for label size
          const labelLength = this.config.labelLength || 90;
          const paperSize = this.config.paperSize || '29mm';
          
          // Format product info with options
          let productInfo = item.name || 'No Product Name';
          if (item.starch) productInfo += ` (${item.starch})`;
          if (item.pressOnly) productInfo += ' (Press Only)';
          
          // Create HTML for a single label with dynamic config
          const html = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=29mm, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
  <style>
    @page {
      size: 29mm ${labelLength}mm;
      margin: 0;
      padding: 0;
    }
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      background: white;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    }
    .label-page {
      width: 29mm;
      height: ${labelLength}mm;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      padding: 3mm;
      box-sizing: border-box;
    }
    .product-name {
      font-size: 12pt;
      font-weight: bold;
      text-align: center;
      margin-bottom: 3mm;
      width: 100%;
      line-height: 1.2;
    }
    .qr-wrapper {
      width: 20mm;
      height: 20mm;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 2mm 0;
    }
    .qr {
      max-width: 100%;
      max-height: 100%;
    }
    .customer-info {
      text-align: center;
      width: 100%;
      margin-top: 3mm;
    }
    .customer-name {
      font-size: 10pt;
      font-weight: bold;
      margin-bottom: 1mm;
    }
    .order-id {
      font-size: 8pt;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="label-page">
    <div class="product-name">${productInfo}</div>
    <div class="qr-wrapper">
      <img class="qr" src="data:image/png;base64,${base64}" />
    </div>
    <div class="customer-info">
      <div class="customer-name">${customerName}</div>
      <div class="order-id">#${orderId.substring(0, 8)}</div>
    </div>
  </div>
</body>
</html>`;
          
          // Print using AirPrint
          await Print.printAsync({
            html,
            printerUrl: undefined, // Let the OS choose the printer
            orientation: 'portrait', // Force portrait orientation
          });
          
          console.log(`[IndividualLabelPrintService] Printed item ${i} using AirPrint`);
          // Add a delay between prints if there are more items
          if (i < items.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        } catch (itemError) {
          console.error(`[IndividualLabelPrintService] Error processing item ${i}:`, itemError);
          // Ensure progress callback is called even on error
          if (onProgress && !progressCalled) {
            onProgress(i + 1, items.length);
          }
        }
      }
      return true;
    } else {
      // For Android, use PrinterService.printHTML for each label
      const printerService = await getPrinterService();
      let success = true;
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        let progressCalled = false;
        try {
          // Report progress (before starting item)
          if (onProgress) {
            onProgress(i + 1, items.length);
            progressCalled = true;
          }
          // Get ViewShot ref for this item
          const ref = viewShotRefs[i];
          if (!ref || !ref.current) {
            console.error(`[IndividualLabelPrintService] ViewShot ref not available for item ${i}`);
            continue;
          }
          // Capture QR code image with MUCH LARGER SIZE
          const imageUri = await captureRef(ref, {
            format: 'png',
            quality: 1.0,
            width: 400, // Make QR physically smaller but still clear
            height: 400, // Make QR physically smaller but still clear
            result: 'tmpfile',
          });
          console.log(`[IndividualLabelPrintService] Captured image for item ${i}:`, imageUri);
          // Read image as base64
          const base64 = await FileSystem.readAsStringAsync(imageUri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          
          // Format product info with options
          let productInfo = item.name || 'No Product Name';
          if (item.starch) productInfo += ` (${item.starch})`;
          if (item.pressOnly) productInfo += ' (Press Only)';
          
          // Use config for label size
          const labelLength = this.config.labelLength || 90;
          const paperSize = this.config.paperSize || '29mm';
          
          // Create HTML for a single label with dynamic config
          const html = `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=29mm, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
  <style>
    @page {
      size: 29mm ${labelLength}mm;
      margin: 0;
      padding: 0;
    }
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      background: white;
      font-family: sans-serif;
    }
    .label-page {
      width: 29mm;
      height: ${labelLength}mm;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      padding: 3mm;
      box-sizing: border-box;
    }
    .product-name {
      font-size: 11pt;
      font-weight: bold;
      text-align: center;
      margin-bottom: 3mm;
      width: 100%;
      line-height: 1.2;
    }
    .qr-wrapper {
      width: 20mm;
      height: 20mm;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 2mm 0;
    }
    .qr {
      max-width: 100%;
      max-height: 100%;
    }
    .customer-info {
      text-align: center;
      width: 100%;
      margin-top: 3mm;
    }
    .customer-name {
      font-size: 10pt;
      font-weight: bold;
      margin-bottom: 1mm;
    }
    .order-id {
      font-size: 8pt;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="label-page">
    <div class="product-name">${productInfo}</div>
    <div class="qr-wrapper">
      <img class="qr" src="data:image/png;base64,${base64}" width="20mm" height="20mm" style="width:20mm;height:20mm;" />
    </div>
    <div class="customer-info">
      <div class="customer-name">${customerName}</div>
      <div class="order-id">#${orderId.substring(0, 8)}</div>
    </div>
  </div>
</body>
</html>`;
          // Save HTML to a temp file
          const tempFilePath = `${FileSystem.cacheDirectory}label_${i}_${Date.now()}.html`;
          await FileSystem.writeAsStringAsync(tempFilePath, html);
          // Print the HTML
          const result = await printerService.printHTML(tempFilePath);
          // Clean up temp file
          await FileSystem.deleteAsync(tempFilePath, { idempotent: true });
          if (!result) {
            console.error(`[IndividualLabelPrintService] Failed to print item ${i}`);
            success = false;
          } else {
            console.log(`[IndividualLabelPrintService] Printed item ${i} successfully`);
          }
          // Add a delay between prints
          if (i < items.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        } catch (itemError) {
          console.error(`[IndividualLabelPrintService] Error processing item ${i}:`, itemError);
          success = false;
          // Ensure progress callback is called even on error
          if (onProgress && !progressCalled) {
            onProgress(i + 1, items.length);
          }
        }
      }
      return success;
    }
  }
  
  /**
   * Create a template for a single 29x90mm vertical label
   */
  static async createLabelTemplate(): Promise<string> {
    // Create an HTML template for a single 29x90mm vertical label
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
      <style>
        @page {
          size: 29mm ${this.config.labelLength}mm;
          margin: 0;
        }
        body {
          margin: 0;
          padding: 0;
          width: 29mm;
          height: ${this.config.labelLength}mm;
          background-color: white;
        }
        .label-page {
          page-break-after: always;
          break-after: page;
        }
      </style>
    </head>
    <body>
    </body>
    </html>
    `;
    
    // Save the template to a file
    const tempFile = `${FileSystem.cacheDirectory}label_template_${Date.now()}.html`;
    await FileSystem.writeAsStringAsync(tempFile, html);
    return tempFile;
  }
}

export default IndividualLabelPrintService;