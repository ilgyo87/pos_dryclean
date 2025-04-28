// QR code PNG generation in React Native must be done via react-native-qrcode-svg + react-native-view-shot
// This file is now a stub to prevent accidental usage of unsupported Node/browser QR code generation libraries.

/**
 * Generate a QR code PNG and save to filesystem (pure JS, no React required)
 * @param qrData string - the data to encode
 * @returns Promise<string> - file URI to the PNG image
 */
/**
 * This function is not supported in React Native. Use react-native-qrcode-svg + react-native-view-shot
 * to render and capture a QR code as a PNG. (QR code modal removed; see direct print implementation.)
 */
import React, { forwardRef } from 'react';
import QRCode from 'react-native-qrcode-svg';
import { captureRef } from 'react-native-view-shot';
import * as FileSystem from 'expo-file-system';
import { View } from 'react-native';

/**
 * A helper component to render a QR code for capture.
 * Usage: <QRCodeCapture ref={ref} value={qrData} size={size} />
 */
export const QRCodeCapture = forwardRef<View, { value: string; size?: number }>(
  ({ value, size = 200 }, ref) => (
    <View ref={ref} collapsable={false} style={{ width: size, height: size, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center' }}>
      <QRCode value={value} size={size} backgroundColor="white" />
    </View>
  )
);

/**
 * Capture a QR code as a PNG and save to filesystem.
 * @param ref - ref to the QRCodeCapture component
 * @param fileName - optional file name (defaults to random)
 * @returns file URI to the PNG image
 */
export async function generateQRCodeImage(ref: React.RefObject<View>, fileName?: string): Promise<string> {
  if (!ref.current) throw new Error('QR code ref is not attached');
  // Capture the QR code as PNG
  const uri = await captureRef(ref, {
    format: 'png',
    quality: 1,
    result: 'tmpfile',
  });
  // Optionally move to a named file
  if (fileName) {
    const dest = FileSystem.cacheDirectory + fileName;
    await FileSystem.moveAsync({ from: uri, to: dest });
    return dest;
  }
  return uri;
}

