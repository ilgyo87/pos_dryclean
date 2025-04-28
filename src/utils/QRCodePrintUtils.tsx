// src/utils/QRCodePrintUtils.tsx
// Utility to programmatically print a sample label without ViewShot or complex images
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

// Break the require cycle by only importing specific types
import type { BrotherPrinterStatus } from './BrotherPrinterService';

// Import functions using dynamic imports to avoid require cycle
const getBrotherService = async () => {
  const module = await import('./BrotherPrinterService');
  return module.default;
};

/**
 * Creates a text-only file for printer test
 * For iOS "Connection reset by peer" problem with Brother printers, we need a much simpler approach
 * @returns Promise<string> The file URI of the generated file
 */
async function createUltraSimpleTestFile(): Promise<string> {
  // Let's create a text file - this is the simplest possible test 
  // Many Brother printers support ESC/P printer format
  
  // Simple text - this works with most Brother printers
  const testText = 'TEST LABEL\n\nPrinted from POS Dryclean\n\n';
  
  // Write to a temporary text file
  const tempFilePath = `${FileSystem.cacheDirectory}test_text_${Date.now()}.txt`;
  await FileSystem.writeAsStringAsync(tempFilePath, testText);
  
  return tempFilePath;
}

/**
 * Creates a valid PNG image for Brother QL printers (e.g., 255x100 px for 29mm roll)
 * @param width - label width in pixels (default 255 for 29mm)
 * @param height - label height in pixels (default 100)
 * @returns Promise<string> The file URI of the generated PNG image
 */
export async function createMinimalTestImage(width = 255, height = 100): Promise<string> {
  // Generate a white background PNG with the text 'TEST' in the center
  // Use a simple PNG base64 for white background, then overlay text (or just use white for now)
  // For best compatibility, use a pre-generated PNG if no drawing library is available

  // Pre-generated blank white PNG (255x100) base64 (created with node-canvas or similar)
  const whitePngBase64 =
    'iVBORw0KGgoAAAANSUhEUgAAAP8AAABkCAYAAACJxwZPAAAAAXNSR0IArs4c6QAAAC5JREFUeF7twTEBAAAAwqD1T20PBxQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADwGAcAAQ7b6zYAAAAASUVORK5CYII=';
  // NOTE: This is a blank white PNG. For a real test, you can generate a PNG with text and encode it to base64. For now, this is sufficient for Brother acceptance.
  const tempFile = `${FileSystem.cacheDirectory}min_test_${Date.now()}.png`;
  await FileSystem.writeAsStringAsync(tempFile, whitePngBase64, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return tempFile;
}

/**
 * Prints a test label using the simplest possible approach
 * For iOS "Connection reset by peer" issues, we bypass image files entirely
 * @param qrValue Optional QR value (unused in this ultra simple version)
 */
export async function printSampleQRCodeLabel(qrValue: string = 'TEST'): Promise<boolean> {
  console.log('[QRCodePrintUtils] Ultra simple test print triggered');
  
  try {
    // Dynamically import Brother service to avoid require cycle
    const BrotherPrinterService = await getBrotherService();
    
    // For iOS, try the most minimal approach
    const isIOS = Platform.OS === 'ios';
    
    // Create test files - use both text and image approach for maximum compatibility
    const testImagePath = await createMinimalTestImage();
console.log('[QRCodePrintUtils] Created test image at:', testImagePath);

// Always use the PNG image for Brother test prints
console.log(`[QRCodePrintUtils] Printing minimal PNG image...`);
const printResult = await BrotherPrinterService.printLabel(testImagePath);
return !!printResult;
  } catch (error) {
    console.error('[QRCodePrintUtils] Ultra simple test print failed:', error);
    return false;
  }
}
