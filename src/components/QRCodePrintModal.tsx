import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  ScrollView, 
  Alert,
  ActivityIndicator
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import QRCode from 'react-native-qrcode-svg';
import { generateQRCodeData } from '../utils/QRCodeGenerator';
import printerService from '../utils/PrinterService';
import { requestBluetoothPermissions } from '../utils/PermissionHandler';
import type { Product } from '../types';
import ViewShot, { captureRef } from 'react-native-view-shot';
import Share from 'react-native-share';
import { CameraRoll } from '@react-native-camera-roll/camera-roll';

interface QRItemProps {
  item: Product;
  customerName: string;
  orderId: string;
  viewShotRef: React.RefObject<any>;
}

// Component for a single QR code preview
const QRItem: React.FC<QRItemProps> = ({ item, customerName, orderId, viewShotRef }) => {
  const qrValue = generateQRCodeData('Product', {
    id: item._id,
    orderItemId: item.orderItemId || item._id,
    orderId: orderId || '',
    customerId: item.customerId || '',
    businessId: item.businessId || '',
  });

  return (
    <View style={styles.qrItemContainer}>
      <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1.0, result: 'tmpfile' }} style={styles.qrBox}>
        <QRCode
          value={qrValue}
          size={80}
        />
        <View style={styles.qrInfoContainer}>
          <Text style={styles.customerName}>{customerName || 'Customer'}</Text>
          <Text style={styles.productName}>{item.name}</Text>
          {item.starch && (
            <Text style={styles.optionText}>Starch: {item.starch}</Text>
          )}
          {item.pressOnly && (
            <Text style={styles.optionText}>Press Only</Text>
          )}
          {item.notes && item.notes.length > 0 && (
            <Text style={styles.optionText} numberOfLines={1}>Note: {item.notes[0]}</Text>
          )}
        </View>
      </ViewShot>
    </View>
  );
};

interface QRCodePrintModalProps {
  visible: boolean;
  onClose: () => void;
  items: Product[];
  customerName: string;
  orderId: string;
  onPrintSuccess?: () => void;
  onPrintError?: (error: Error) => void;
  onPrintComplete?: (success: boolean) => void;
}

const QRCodePrintModal: React.FC<QRCodePrintModalProps> = ({
  visible,
  onClose,
  items,
  customerName,
  orderId,
  onPrintSuccess,
  onPrintError,
  onPrintComplete
}) => {
  const [isLoading, setIsLoading] = useState(false);

  // Refs for view-shot (one per item)
  const viewShotRefs = useRef<React.RefObject<ViewShot>[]>([]);
  useEffect(() => {
    // Sync refs with items
    if (items.length !== viewShotRefs.current.length) {
      viewShotRefs.current = items.map(() => React.createRef());
    }
  }, [items]);

  // Handle print action
  const handlePrint = async () => {
    if (items.length === 0) {
      Alert.alert('Error', 'No items to print');
      return;
    }

    try {
      setIsLoading(true);
      
      // Request permissions
      const hasPermissions = await requestBluetoothPermissions();
      if (!hasPermissions) {
        Alert.alert(
          'Permission Required',
          'Bluetooth permissions are required to print QR codes'
        );
        setIsLoading(false);
        return;
      }

      // Print QR codes using the printer service
      const success = await printerService.printQRCodes(
        items, 
        customerName, 
        orderId
      );

      if (success) {
        if (onPrintSuccess) onPrintSuccess();
      } else {
        throw new Error('Printing failed');
      }

      // Notify on completion
      if (onPrintComplete) onPrintComplete(success);
    } catch (error) {
      console.error('Print error:', error);
      if (onPrintError) onPrintError(error as Error);
      Alert.alert('Print Error', `Failed to print QR codes: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>QR Code Preview</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={onClose}
              disabled={isLoading}
            >
              <MaterialIcons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 20 }}>
            {items.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No items to print.</Text>
              </View>
            ) : (
              items.map((item, idx) => (
                <QRItem
                  key={item._id}
                  item={item}
                  customerName={customerName}
                  orderId={orderId}
                  viewShotRef={viewShotRefs.current[idx]}
                />
              ))
            )}
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              disabled={isLoading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.printButton, (isLoading || items.length === 0) && styles.disabledButton]}
              onPress={handlePrint}
              disabled={isLoading || items.length === 0}
            >
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={styles.printButtonText}>Printing...</Text>
                </View>
              ) : (
                <Text style={styles.printButtonText}>Print QR Codes</Text>
              )}
            </TouchableOpacity>

            {/* Share to Print Master button for the first QR label */}
            <TouchableOpacity
              style={[styles.printButton, { backgroundColor: '#34c759', marginTop: 12 }]}
              onPress={async () => {
                try {
                  if (!items || items.length === 0) {
                    Alert.alert('Error', 'No QR label to share');
                    return;
                  }
                  // Only share the first label for now
                  const ref = viewShotRefs.current[0] as React.RefObject<ViewShot>;
                  if (ref && ref.current && typeof ref.current.capture === 'function') {
                    const uri = await ref.current.capture();
                    // Save to gallery
                    try {
                      await CameraRoll.save(uri, { type: 'photo' });
                      Alert.alert(
                        'Saved to Gallery',
                        'Label saved to gallery. Open Print Master and import the image from your gallery to print.'
                      );
                    } catch (galleryErr) {
                      Alert.alert('Save Error', `Failed to save image to gallery: ${galleryErr}`);
                    }
                  } else {
                    Alert.alert('Error', 'Unable to capture label image');
                  }
                } catch (e) {
                  Alert.alert('Share Error', `Failed to share QR label: ${e}`);
                }
              }}
              disabled={isLoading || items.length === 0}
            >
              <Text style={styles.printButtonText}>Share to Print Master</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default QRCodePrintModal;

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 500,
    backgroundColor: '#fff',
    borderRadius: 12,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
  },
  scrollContent: {
    flex: 1,
  },
  qrList: {
    padding: 16,
  },
  qrItemContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#f5f8fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  qrBox: {
    minWidth: 88,
    height: 88,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 4,
  },
  qrInfoContainer: {
    marginLeft: 16,
    flex: 1,
    justifyContent: 'center',
  },
  customerName: {
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 4,
  },
  productName: {
    fontSize: 14,
    color: '#0066cc',
    fontWeight: '500',
    marginBottom: 4,
  },
  optionText: {
    fontSize: 12,
    color: '#666',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#666',
    fontStyle: 'italic',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
  },
  printButton: {
    backgroundColor: '#007bff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  printButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  disabledButton: {
    backgroundColor: '#cccccc',
    opacity: 0.7,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});