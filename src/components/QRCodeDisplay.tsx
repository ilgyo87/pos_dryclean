import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import ViewShot, { captureRef } from 'react-native-view-shot';

interface QRCodeDisplayProps {
  qrValue: string;
  businessName?: string;
  onCapture?: (uri: string) => void;
  onClose?: () => void;
}

export function QRCodeDisplay({ qrValue, businessName, onCapture, onClose }: QRCodeDisplayProps) {
  const viewShotRef = useRef<ViewShot>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  
  useEffect(() => {
    if (viewShotRef.current && onCapture) {
      // Give time for QR code to render completely
      const timerId = setTimeout(() => {
        setIsCapturing(true);
        
        // Use captureRef utility function instead of calling .capture() directly
        captureRef(viewShotRef)
          .then(uri => {
            console.log("QR code captured successfully");
            onCapture(uri);
            setIsCapturing(false);
          })
          .catch(error => {
            console.error("Error capturing QR code:", error);
            setIsCapturing(false);
          });
      }, 500);
      
      return () => clearTimeout(timerId);
    }
  }, [onCapture]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Business QR Code</Text>
      
      {businessName && <Text style={styles.businessName}>{businessName}</Text>}
      
      <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 0.9 }}>
        <View style={styles.qrContainer}>
          <QRCode
            value={qrValue}
            size={200}
            color='#000'
            backgroundColor='#FFF'
          />
        </View>
      </ViewShot>
      
      {isCapturing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Creating your business...</Text>
        </View>
      ) : (
        onClose && (
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Cancel</Text>
          </TouchableOpacity>
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F9F9F9',
    borderRadius: 10,
    width: '100%',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  businessName: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 20,
  },
  qrContainer: {
    padding: 15,
    backgroundColor: '#FFF',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 20,
  },
  closeButton: {
    backgroundColor: '#E53935',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 5,
    marginTop: 15,
  },
  closeButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '500',
  },
  loadingContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  }
});