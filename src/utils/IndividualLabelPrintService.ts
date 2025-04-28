// src/utils/IndividualLabelPrintService.ts
// Service for printing individual QR code labels in 29x90mm format

import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { captureRef } from 'react-native-view-shot';
import { Product } from '../types';

// Dynamic import to avoid circular dependencies
const getBrotherService = async () => {
  if (Platform.OS === 'ios') {
    // Use AirPrint service for iOS to avoid connection reset issues
    const module = await import('./BrotherPrinterService');
    return module.default;
  } else {
    // Use direct Brother SDK for Android
    const module = await import('./BrotherPrinterService');
    return module.default;
  }
};

/**
 * Configuration for individual label printing
 */
export interface LabelPrintConfig {
  paperSize: '29mm' | '38mm' | '50mm' | '54mm' | '62mm';
  labelLength: number; // in mm, for continuous paper
  margin: number; // in mm
  delayBetweenPrints: number; // in ms
}

/**
 * Default configuration for 29x90mm labels
 */
export const DEFAULT_29X90_CONFIG: LabelPrintConfig = {
  paperSize: '29mm',
  labelLength: 90, // 90mm length
  margin: 3, // 3mm margin
  delayBetweenPrints: 500 // 500ms delay between prints
};

/**
 * Service for printing individual QR code labels
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
   * Print individual QR code labels
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
      console.log('[IndividualLabelPrintService] Starting individual label printing for', items.length, 'items');
      
      // For iOS, we can skip the printer connection check and go directly to AirPrint
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
            // Capture QR code image
            const imageUri = await captureRef(ref, { 
              format: 'png', 
              quality: 1.0,
              result: 'tmpfile'
            });
            
            console.log(`[IndividualLabelPrintService] Captured image for item ${i}:`, imageUri);
            
            // Import expo-print dynamically
            const Print = await import('expo-print');
            
            // Read the image as base64
            const base64 = await FileSystem.readAsStringAsync(imageUri, { 
              encoding: FileSystem.EncodingType.Base64 
            });
            
            // Create HTML for a single label with the correct dimensions and proper image size
            const html = `
            <!DOCTYPE html>
            <html>
            <head>
              <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
              <style>
                @page {
                  size: 29mm 90mm; /* Keep original dimensions */
                  margin: 0;
                  padding: 0;
                }
                body {
                  margin: 0;
                  padding: 0;
                  width: 29mm;
                  height: 90mm;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                }
                .label-container {
                  width: 100%;
                  height: 100%;
                  display: flex;
                  flex-direction: column;
                  justify-content: center;
                  align-items: center;
                }
                img {
                  width: 90%; /* Make image fill most of the container */
                  height: auto;
                  object-fit: contain;
                }
              </style>
            </head>
            <body>
              <div class="label-container">
                <img src="data:image/png;base64,${base64}" />
              </div>
            </body>
            </html>
            `;
            
            // Print using AirPrint with correct dimensions
            await Print.printAsync({
              html,
              printerUrl: undefined, // Let the OS choose the printer
              orientation: 'portrait', // Force portrait orientation
            });
            
            console.log(`[IndividualLabelPrintService] Printed item ${i} using AirPrint`);
            
            // Add a delay between prints if there are more items
            if (i < items.length - 1) {
              await new Promise(resolve => setTimeout(resolve, this.config.delayBetweenPrints));
            }
          } catch (itemError) {
            console.error(`[IndividualLabelPrintService] Error processing item ${i}:`, itemError);
          }
        }
        
        return true;
      } else {
        // For Android, we need to check if the printer is connected
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
            // Capture QR code image
            const imageUri = await captureRef(ref, { 
              format: 'png', 
              quality: 1.0,
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
              await new Promise(resolve => setTimeout(resolve, this.config.delayBetweenPrints));
            }
          } catch (itemError) {
            console.error(`[IndividualLabelPrintService] Error processing item ${i}:`, itemError);
            success = false;
          }
        }
        
        return success;
      }
    } catch (error) {
      console.error('[IndividualLabelPrintService] Print error:', error);
      throw error;
    }
  }
  
  /**
   * Create a template for a single 29x90mm label
   * This ensures the label is properly sized for the Brother printer
   */
  static async createLabelTemplate(): Promise<string> {
    // Create an HTML template for a single 29x90mm label with correct orientation
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
          padding: 0;
          width: 29mm;
          height: 90mm;
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
