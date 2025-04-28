// src/utils/QRCodePrintUtils.tsx
// Utility to programmatically print a sample label without ViewShot or complex images
import * as FileSystem from 'expo-file-system';
import BrotherPrinterService, { BrotherPrinterStatus } from './BrotherPrinterService';
import { Platform } from 'react-native';

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
 * Prints a test label using the simplest possible approach
 * For iOS "Connection reset by peer" issues, we bypass image files entirely
 * @param qrValue Optional QR value (unused in this ultra simple version)
 */
export async function printSampleQRCodeLabel(qrValue: string = 'TEST'): Promise<boolean> {
  console.log('[QRCodePrintUtils] Ultra simple test print triggered');
  
  try {
    // For iOS, try the most minimal approach for Brother printers
    const isIOS = Platform.OS === 'ios';
    
    if (isIOS) {
      // For iOS, we need an ultra-simple approach
      console.log('[QRCodePrintUtils] Using text-only test file for iOS');
      
      // Create test file instead of image
      const testFilePath = await createUltraSimpleTestFile();
      console.log('[QRCodePrintUtils] Created text file at:', testFilePath);
      
      // Force printer reconnection before printing
      const status = BrotherPrinterService.getStatus();
      if (status.status !== BrotherPrinterStatus.CONNECTED) {
        console.log('[QRCodePrintUtils] Forcing printer reconnection');
        const config = BrotherPrinterService.getConfig();
        if (config) {
          await BrotherPrinterService.disconnect();
          await new Promise(resolve => setTimeout(resolve, 2000));
          await BrotherPrinterService.connectToPrinter(
            config.address,
            config.connectionType,
            config.serialNumber
          );
        }
      }
      
      // Use very simple settings
      const printResult = await BrotherPrinterService.printLabel(testFilePath);
      return !!printResult;
    } else {
      // For Android, use a simple image (more likely to work)
      const smallTestImage = 'iVBORw0KGgoAAAANSUhEUgAAAKAAAAA8CAIAAABx1+q9AAAACXBIWXMAAA7EAAAOxAGVKw4bAAADAElEQVR4nO2bMW4UMRSGvxmzu0QbRYIbkFyAq3AAijQUdEhUcIBUKegQHQ1lKgoKOISEoKIJHRJIrLLZnbwUb4MVZTJex+PJwP83keWxPfb/enrzzRtfxBhRyo1h3yegtEcNKBlqQMlQA0qGGlAy1ICScbc5EBGt0xI6MzcYXjSXrvcvyBiW/L5dHGYvs7leNSJCe2TG6k3zQCnRZ+P4fGz33i+6nfzJAAy5nxHNcC9P1wKNAMhm0N2sFZbFYLvMCxdwwlF4LQCT3kkRWe0FAeRRAY8/nK9JWjWK+Prj4PH0k4SsQFmzRJ0B18LD98i1wMf05aPHb99cQS2sXHXM0/0EufJqGpkXkJQvFI6IZkQWg0DmfZ+DCcZuLWGJ5vw4vXoVOkXx02HshJbAHcJNAVltL+fXxO4EWQ8s1+PNgQZFn0vqkV1sS2Uw6BxH06KlVvPcbxwK3xZbRMFW31XYb5SIJKobGduvI1s+G0LdmI251E7IYnARNNS3mxp3G0GFDHKtsdQs+kIKNeBKCDQyRvHiOvapnLSRbR6kK6Sl9b9sXqTJQW9JJW6dLSOPSkYnb6eYkhNqwJVg0iSzbz+PvD5ZXz6++Gb255d1V+i02RlxUV9kNDp4a9e4U2S8qNs5aTyKAw3YHfHt1zcA394/fGI3bQVJcpI8q03BO7DpeTFdJ2+nTjKiUQDTzxTaGLIb+fnzR7s9OpCE/E3NhepOoXGCY+CbqWRo0IGWo7PJwCXnzKe4+PjiyerAZgQb';
      const tempFile = `${FileSystem.cacheDirectory}test_label_android_${Date.now()}.png`;
      await FileSystem.writeAsStringAsync(tempFile, smallTestImage, { 
        encoding: FileSystem.EncodingType.Base64 
      });
      
      // Log file URI and size
      const fileInfo = await FileSystem.getInfoAsync(tempFile);
      console.log('[QRCodePrintUtils] Created simple test image for Android at:', tempFile, 'fileInfo:', fileInfo);
      if (!fileInfo.exists || (fileInfo.exists && 'size' in fileInfo && fileInfo.size === 0)) {
        console.warn('[QRCodePrintUtils] WARNING: Test image file does not exist or is empty!', fileInfo);
      }
      const printResult = await BrotherPrinterService.printLabel(tempFile);
      return !!printResult;
    }
  } catch (error) {
    console.error('[QRCodePrintUtils] Ultra simple test print failed:', error);
    return false;
  }
}
