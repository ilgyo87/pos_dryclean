// src/utils/IndividualLabelPrintService.ts
// Service for printing QR code labels in 29x90mm format (vertical)

import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { captureRef } from 'react-native-view-shot';
import { Product } from '../types';

// Dynamic import to avoid circular dependencies
const getBrotherService = async () => {
  const module = await import('./BrotherPrinterService');
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
    return this.config;
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
            width: 2000, // Force extremely large capture width
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
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
  <style>
    @page {
      /* No specific size - let printer determine */
      margin: 0;
      padding: 0;
    }
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column; /* Change to column to stack items vertically */
      justify-content: center;
      align-items: center;
      overflow: hidden;
    }
    .label-container {
      width: 100vw;
      height: 100vh;
      display: flex;
      flex-direction: column; /* Change to column to stack items vertically */
      justify-content: center;
      align-items: center;
      overflow: hidden;
      page-break-after: always; /* Force page break after each item */
    }
    .label-container:last-child {
      page-break-after: auto;
    }
    img {
      width: 100vw; /* Full viewport width */
      height: 100vh; /* Full viewport height */
      object-fit: contain;
      transform: scale(2); /* Double the size */
    }
  </style>
</head>
<body>
      `;
      
      // Process each captured image to base64
      for (let i = 0; i < capturedImages.length; i++) {
        if (onProgress) {
          onProgress(items.length + i + 1, items.length * 2); // Second half is printing
        }
        
        const base64 = await FileSystem.readAsStringAsync(capturedImages[i], { 
          encoding: FileSystem.EncodingType.Base64 
        });
        
        htmlContent += `
        <div class="label-container">
          <img src="data:image/png;base64,${base64}" />
        </div>
        `;
      }
      
      // Close the HTML document
      htmlContent += `
      </body>
      </html>
      `;
      
      // Print using appropriate platform method
      if (Platform.OS === 'ios') {
        // For iOS, use AirPrint with portrait orientation
        await Print.printAsync({
          html: htmlContent,
          orientation: 'portrait', // Force portrait orientation for vertical labels
        });
      } else {
        // For Android, save the HTML to a file and print it using Brother service
        const tempFile = `${FileSystem.cacheDirectory}labels_${Date.now()}.html`;
        await FileSystem.writeAsStringAsync(tempFile, htmlContent);
        
        // Get Brother printer service
        const printerService = await getBrotherService();
        
        // Configure printer
        const status = printerService.getStatus();
        if (status.status !== 'connected') {
          throw new Error('Printer is not connected. Please connect a printer first.');
        }
        
        // Print the file
        const result = await printerService.printHtml(tempFile);
        if (!result) {
          throw new Error('Failed to print using Brother service');
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
   */
  private static async printSeparateLabels(
    items: Product[],
    customerName: string,
    orderId: string,
    viewShotRefs: React.RefObject<any>[],
    onProgress?: (current: number, total: number) => void
  ): Promise<boolean> {
    console.log('[IndividualLabelPrintService] Using separate print jobs for each label');
    
    // For iOS, use AirPrint
    if (Platform.OS === 'ios') {
      // Process each item individually
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        
        // Report progress
        if (onProgress) {
          onProgress(i + 1, items.length);
        }
        
        // Get ViewShot ref for this item
        const ref = viewShotRefs[i];
        if (!ref || !ref.current) {
          console.error(`[IndividualLabelPrintService] ViewShot ref not available for item ${i}`);
          continue;
        }
        
        try {
          // Capture QR code image with MUCH LARGER SIZE
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
          
          // Create HTML for a single label with VERTICAL LAYOUT
          const html = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
            <style>
              @page {
                /* No specific size - let printer determine */
                margin: 0;
                padding: 0;
                border: 1px solid black;
              }
              html, body {
                margin: 0;
                padding: 0;
                width: 100%;
                height: 100%;
                display: flex;
                flex-direction: column; /* Change to column to stack items vertically */
                justify-content: center;
                align-items: center;
                overflow: hidden;
              }
              .qr-container {
                width: 100vw;
                height: 100vh;
                display: flex;
                flex-direction: column; /* Change to column to stack items vertically */
                justify-content: center;
                align-items: center;
                margin: 1;
                overflow: hidden;
              }
              img {
                width: 100vw; /* Full viewport width */
                height: 100vh; /* Full viewport height */
                object-fit: contain;
                transform: scale(2); /* Double the size */
              }
            </style>
          </head>
          <body>
            <div class="qr-container">
              <img src="data:image/png;base64,${base64}" />
            </div>
          </body>
          </html>
          `;
          
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
        }
      }
      
      return true;
    } else {
      // For Android, use Brother SDK directly
      const printerService = await getBrotherService();
      
      // Check if printer is connected
      const status = printerService.getStatus();
      if (status.status !== 'connected') {
        throw new Error('Printer is not connected. Please connect a printer first.');
      }
      
      // Get printer config
      const printerConfig = printerService.getConfig();
      if (!printerConfig) {
        throw new Error('Printer configuration not found.');
      }
      
      // Set paper size from our config
      if (printerConfig.paperSize !== this.config.paperSize) {
        printerConfig.paperSize = this.config.paperSize;
        await printerService.saveConfig(printerConfig);
      }
      
      let success = true;
      
      // Process each item individually
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        
        // Report progress
        if (onProgress) {
          onProgress(i + 1, items.length);
        }
        
        // Get ViewShot ref for this item
        const ref = viewShotRefs[i];
        if (!ref || !ref.current) {
          console.error(`[IndividualLabelPrintService] ViewShot ref not available for item ${i}`);
          continue;
        }
        
        try {
          // Capture QR code image with MUCH LARGER SIZE
          const imageUri = await captureRef(ref, { 
            format: 'png', 
            quality: 1.0,
            width: 2000, // Force extremely large capture width
            height: 2000, // Force extremely large capture height
            result: 'tmpfile'
          });
          
          console.log(`[IndividualLabelPrintService] Captured image for item ${i}:`, imageUri);
          
          // For Android, use the Brother SDK directly
          const result = await printerService.printLabel(imageUri);
          
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
      </style>
    </head>
    <body></body>
    </html>
    `;
    
    // Save the template to a file
    const tempFile = `${FileSystem.cacheDirectory}label_template_${Date.now()}.html`;
    await FileSystem.writeAsStringAsync(tempFile, html);
    return tempFile;
  }
}

export default IndividualLabelPrintService;
