import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, LayoutChangeEvent } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { captureRef } from 'react-native-view-shot';
import { uploadData } from 'aws-amplify/storage';
import * as FileSystem from 'expo-file-system';

interface QRCodeCaptureProps {
  value: string;
  size?: number;
  entityType: string;
  entityId: string;
  onCapture: (key: string) => void;
}

const QRCodeCapture: React.FC<QRCodeCaptureProps> = ({
  value,
  size = 200,
  entityType,
  entityId,
  onCapture
}) => {
  const qrRef = useRef<View>(null);
  const [isLayoutReady, setIsLayoutReady] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 }); // Track actual dimensions

  useEffect(() => {
    const captureQRCode = async () => {
      // Only proceed if layout is ready, ref exists, and dimensions are valid
      if (isLayoutReady && qrRef.current && dimensions.width > 0 && dimensions.height > 0) {
        try {
          console.log(`Attempting QR capture with dimensions: ${dimensions.width}x${dimensions.height}`);
          // Capture the QR code as an image
          const uri = await captureRef(qrRef, {
            format: 'png',
            quality: 1
          });

          // Read the file as base64
          const base64Data = await FileSystem.readAsStringAsync(uri, {
            encoding: FileSystem.EncodingType.Base64
          });

          // Create a unique filename
          const filename = `qrcodes/${entityType}/${entityId}.png`;

          // Upload to S3 using Amplify Gen 2 syntax
          const result = await uploadData({
            key: filename,
            data: Buffer.from(base64Data, 'base64'),
            options: {
              contentType: 'image/png'
            }
          });
          console.log('QR Code Upload Result:', result); // Log success

          // Call the completion handler
          onCapture(filename);
        } catch (error) {
          console.error('Error capturing or uploading QR code:', error);
          // Optionally call onCapture with an error indicator or null
          // onCapture(null); 
        }
      } else {
        console.log('QR Code Capture: Waiting for layout...'); // Log if waiting
      }
    };

    // Call captureQRCode whenever dependencies change OR when layout becomes ready
    captureQRCode();

  }, [value, entityType, entityId, onCapture, size, isLayoutReady]); // Added isLayoutReady dependency

  // Handler for onLayout event
  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    console.log(`QR Code Layout dimensions: ${width}x${height}`);
    
    // Only set ready if we have positive dimensions
    if (width > 0 && height > 0) {
      setDimensions({ width, height });
      if (!isLayoutReady) {
        console.log('QR Code View Layout Ready with valid dimensions');
        setIsLayoutReady(true);
      }
    }
  };

  return (
    // Added onLayout and collapsable={false}
    <View
    ref={qrRef}
    style={[styles.container, { width: size, height: size }]}
    onLayout={handleLayout}
    collapsable={false}
  >
    <QRCode
      value={value}
      size={size}
      backgroundColor="white"
      color="black"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    // Don't use padding here as it affects capture dimensions
    marginVertical: 20 // Add margin instead of padding
  }
});

export default QRCodeCapture;