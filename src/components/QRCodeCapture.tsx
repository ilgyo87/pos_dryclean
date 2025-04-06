import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, LayoutChangeEvent, Text, ActivityIndicator } from 'react-native';
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
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [error, setError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  useEffect(() => {
    const captureQRCode = async () => {
      // Only proceed if layout is ready, ref exists, and dimensions are valid
      if (isLayoutReady && qrRef.current && dimensions.width > 0 && dimensions.height > 0) {
        setIsCapturing(true);
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
          console.log('QR Code Upload Result:', result);
          
          // Reset error state if successful
          setError(null);
          
          // Call the completion handler
          onCapture(filename);
        } catch (err: any) {
          console.error('Error capturing or uploading QR code:', err);
          // Store error message but don't display it directly
          setError(err.message || 'Unknown error occurred');
        } finally {
          setIsCapturing(false);
        }
      }
    };

    // Call captureQRCode whenever dependencies change OR when layout becomes ready
    captureQRCode();

  }, [value, entityType, entityId, onCapture, size, isLayoutReady]);

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
    <View style={styles.wrapper}>
      {/* QR Code rendering container */}
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
      
      {/* Status indicators - all wrapped in Text components */}
      {isCapturing && (
        <View style={styles.statusContainer}>
          <ActivityIndicator size="small" color="#007bff" />
          <Text style={styles.statusText}>Processing QR code...</Text>
        </View>
      )}
      
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: {error}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  statusText: {
    marginLeft: 10,
    color: '#007bff',
  },
  errorContainer: {
    marginTop: 10,
    padding: 8,
    backgroundColor: '#ffebee',
    borderRadius: 4,
  },
  errorText: {
    color: '#d32f2f',
  }
});

export default QRCodeCapture;