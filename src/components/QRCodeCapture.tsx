import React, { useRef, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
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
  
  useEffect(() => {
    const captureQRCode = async () => {
      if (qrRef.current) {
        try {
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
          
          // Call the completion handler
          onCapture(filename);
        } catch (error) {
          console.error('Error capturing QR code:', error);
        }
      }
    };
    
    captureQRCode();
  }, [value, entityType, entityId, onCapture]);
  
  return (
    <View ref={qrRef} style={styles.container}>
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
    padding: 10,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center'
  }
});

export default QRCodeCapture;