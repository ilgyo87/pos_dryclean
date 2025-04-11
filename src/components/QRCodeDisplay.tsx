import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import ViewShot, { captureRef } from 'react-native-view-shot';
import type { EntityType } from './../utils/QRCodeGenerator';
import { uploadQRCapture } from './../utils/QRCodeGenerator';

interface QRCodeDisplayProps {
  qrValue: string;
  entityType?: EntityType;
  title?: string;
  onClose?: () => void;
}

export function QRCodeDisplay({ 
  qrValue, 
  entityType = 'Unknown', 
  title,
  onClose 
}: QRCodeDisplayProps) {
  const viewShotRef = useRef<ViewShot>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  
  useEffect(() => {
    if (viewShotRef.current) {
      setIsCapturing(true);
      
      // Use requestAnimationFrame to ensure the view is rendered before capturing
      const timerId = setTimeout(() => {
        requestAnimationFrame(() => {
          captureRef(viewShotRef)
            .then(uri => {
              console.log("QR code captured successfully");
              uploadQRCapture(uri, entityType, title || 'Unknown');
              setIsCapturing(false);
            })
            .catch(error => {
              console.error("Error capturing QR code:", error);
              setIsCapturing(false);
            });
        });
      }, 300); // Short delay to ensure view is fully rendered
      
      return () => clearTimeout(timerId);
    }
  }, [qrValue]);

  // Determine display title based on props
  const displayTitle = title || `${entityType} QR Code`;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{displayTitle}</Text>
      
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
          <Text style={styles.loadingText}>
            {entityType ? `Creating your ${entityType.toLowerCase()}...` : 'Processing...'}
          </Text>
        </View>
      ) : (
        <View style={styles.buttonContainer}>
          {onClose && (
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>
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
    maxWidth: 350,
    alignSelf: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
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
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
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