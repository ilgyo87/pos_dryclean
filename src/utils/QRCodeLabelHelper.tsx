// QR code PNG generation in React Native must be done via react-native-qrcode-svg + react-native-view-shot
// This file is now a stub to prevent accidental usage of unsupported Node/browser QR code generation libraries.

/**
 * Generate a QR code PNG and save to filesystem (pure JS, no React required)
 * @param qrData string - the data to encode
 * @returns Promise<string> - file URI to the PNG image
 */
/**
 * This function is not supported in React Native. Use react-native-qrcode-svg + react-native-view-shot
 * to render and capture a QR code as a PNG. See QRCodePrintModal.tsx for working implementation.
 */
export async function generateQRCodeImage(_qrData: string): Promise<string> {
  throw new Error('generateQRCodeImage is not supported in React Native. Use react-native-qrcode-svg and react-native-view-shot.');
}
