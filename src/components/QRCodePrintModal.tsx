// src/components/QRCodePrintModal.tsx - Modified version
import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  ScrollView, 
  Alert,
  ActivityIndicator,
  Platform,
  Image
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import QRCode from 'react-native-qrcode-svg';
import { generateQRCodeData } from '../utils/QRCodeGenerator';
import { Product } from '../types';
import ViewShot, { captureRef } from 'react-native-view-shot';
import Share from 'react-native-share';
import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import { useNavigation } from '@react-navigation/native';
import { getGarmentImage } from '../utils/ImageMapping';

// Format starch level for display
const formatStarch = (starch?: string): string => {
  if (!starch || starch === 'none') return '';
  return starch.charAt(0).toUpperCase() + starch.slice(1);
};

interface QRItemProps {
  item: Product;
  customerName: string;
  orderId: string;
  viewShotRef: React.RefObject<any>;
}

// Component for a single QR code preview with improved item details
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
        <View style={styles.qrLeftSection}>
          <QRCode
            value={qrValue}
            size={90}
          />
          <View style={styles.optionTags}>
            {item.starch && item.starch !== 'none' && (
              <View style={styles.optionTag}>
                <Text style={styles.optionTagText}>
                  {formatStarch(item.starch)}
                </Text>
              </View>
            )}
            {item.pressOnly && (
              <View style={[styles.optionTag, styles.pressOnlyTag]}>
                <Text style={styles.optionTagText}>Press Only</Text>
              </View>
            )}
          </View>
        </View>
        <View style={styles.qrInfoContainer}>
          <Text style={styles.customerName}>{customerName || 'Customer'}</Text>
          <View style={styles.productRow}>
            <Image 
              source={getGarmentImage(item.imageName || 'default')} 
              style={styles.productImage} 
              resizeMode="contain"
            />
            <Text style={styles.productName}>{item.name || 'No Product Name'}</Text>
          </View>
          
          {item.notes && item.notes.length > 0 && (
            <View style={styles.notesContainer}>
              <Text style={styles.notesLabel}>Notes:</Text>
              <Text style={styles.notesText} numberOfLines={2}>
                {item.notes[0]}
              </Text>
            </View>
          )}
          
          <Text style={styles.orderIdText}>Order: #{orderId.substring(0, 8)}</Text>
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
  const [printProgress, setPrintProgress] = useState({ current: 0, total: 0 });
  const navigation = useNavigation<any>();

  // Refs for view-shot (one per item)
  const viewShotRefs = useRef<React.RefObject<ViewShot>[]>([]);
  useEffect(() => {
    // Sync refs with items
    if (items.length !== viewShotRefs.current.length) {
      viewShotRefs.current = items.map(() => React.createRef());
    }
  }, [items]);

  // Handle print action - UPDATED to use IndividualLabelPrintService
  const handlePrint = async () => {
    if (items.length === 0) {
      Alert.alert('Error', 'No items to print');
      return;
    }

    try {
      setIsLoading(true);
      setPrintProgress({ current: 0, total: items.length });
      
      // Import the IndividualLabelPrintService
      const { default: IndividualLabelPrintService } = await import('../utils/IndividualLabelPrintService');
      
      // Print each item as an individual label
      const success = await IndividualLabelPrintService.printIndividualLabels(
        items,
        customerName,
        orderId,
        viewShotRefs.current,
        (current, total) => {
          // Update progress in UI
          setPrintProgress({ current, total });
          console.log(`Printing label ${current} of ${total}`);
        }
      );
      
      if (success) {
        // Show success message
        Alert.alert('Success', 'QR labels printed successfully');
        
        // Notify on completion
        if (onPrintSuccess) onPrintSuccess();
        if (onPrintComplete) onPrintComplete(true);
      } else {
        throw new Error('Some labels failed to print');
      }
    } catch (error) {
      console.error('Print error:', error);
      if (onPrintError) onPrintError(error as Error);
      Alert.alert('Print Error', `Failed to print QR codes: ${error}`);
      
      // Notify on completion
      if (onPrintComplete) onPrintComplete(false);
    } finally {
      setIsLoading(false);
      setPrintProgress({ current: 0, total: 0 });
    }
  };

  // Save QR code to gallery
  const handleSaveToGallery = async (index: number = 0) => {
    try {
      if (!items || items.length === 0) {
        Alert.alert('Error', 'No QR label to save');
        return;
      }
      
      setIsLoading(true);
      
      // Only save the specified index (default is first label)
      const ref = viewShotRefs.current[index];
      if (ref && ref.current && typeof ref.current.capture === 'function') {
        const uri = await ref.current.capture();
        
        // Save to gallery
        await CameraRoll.save(uri, { type: 'photo' });
        
        Alert.alert(
          'Saved to Gallery',
          'Label saved to gallery. You can print it from your gallery app.'
        );
      } else {
        throw new Error('Unable to capture label image');
      }
    } catch (error) {
      console.error('Error saving to gallery:', error);
      Alert.alert('Save Error', `Failed to save image to gallery: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Share QR code
  const handleShareQRCode = async (index: number = 0) => {
    try {
      if (!items || items.length === 0) {
        Alert.alert('Error', 'No QR label to share');
        return;
      }
      
      setIsLoading(true);
      
      // Only share the specified index (default is first label)
      const ref = viewShotRefs.current[index];
      if (ref && ref.current && typeof ref.current.capture === 'function') {
        const uri = await ref.current.capture();
        
        await Share.open({
          url: Platform.OS === 'ios' ? `file://${uri}` : uri,
          type: 'image/png',
          title: 'Share QR Code',
        });
      } else {
        throw new Error('Unable to capture label image');
      }
    } catch (error) {
      // User cancelled the share
      if ((error as any).message !== 'User did not share') {
        console.error('Error sharing QR code:', error);
        Alert.alert('Share Error', `Failed to share QR code: ${error}`);
      }
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
            <Text style={styles.modalTitle}>QR Code Print Preview</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={onClose}
              disabled={isLoading}
            >
              <MaterialIcons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent}>
            {items.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No items to print.</Text>
              </View>
            ) : (
              <>
                {/* Title section */}
                <View style={styles.printerStatusContainer}>
                  <Text style={styles.printerStatusLabel}>QR Code Labels</Text>
                  <Text style={styles.printerStatusInfo}>
                    Each item will be printed as a separate 29x90mm label
                  </Text>
                </View>
                
                <Text style={styles.sectionTitle}>
                  Labels to Print ({items.length})
                </Text>
                
                {/* QR code items */}
                {items.map((item, idx) => (
                  <View key={item._id + idx} style={styles.itemWrapper}>
                    <QRItem
                      item={item}
                      customerName={customerName}
                      orderId={orderId}
                      viewShotRef={viewShotRefs.current[idx]}
                    />
                    
                    {/* Individual item actions */}
                    <View style={styles.itemActions}>
                      <TouchableOpacity 
                        style={styles.itemActionButton}
                        onPress={() => handleSaveToGallery(idx)}
                      >
                        <MaterialIcons name="save-alt" size={16} color="#2196F3" />
                        <Text style={styles.itemActionText}>Save</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={styles.itemActionButton}
                        onPress={() => handleShareQRCode(idx)}
                      >
                        <MaterialIcons name="share" size={16} color="#4CAF50" />
                        <Text style={styles.itemActionText}>Share</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </>
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
              style={[
                styles.printButton, 
                (isLoading || items.length === 0) && styles.disabledButton
              ]}
              onPress={handlePrint}
              disabled={isLoading || items.length === 0}
            >
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={styles.printButtonText}>
                    {printProgress.current > 0 
                      ? `Printing ${printProgress.current}/${printProgress.total}...` 
                      : 'Printing...'}
                  </Text>
                </View>
              ) : (
                <>
                  <MaterialIcons name="print" size={18} color="#fff" />
                  <Text style={styles.printButtonText}>Print Individual Labels</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

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
  scrollContent: {
    padding: 16,
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
  printerStatusContainer: {
    flexDirection: 'column',
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  printerStatusLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  printerStatusInfo: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  itemWrapper: {
    marginBottom: 24,
  },
  qrItemContainer: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    overflow: 'hidden',
  },
  qrBox: {
    flexDirection: 'row',
    padding: 12,
  },
  qrLeftSection: {
    marginRight: 12,
  },
  qrInfoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  customerName: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  productImage: {
    width: 20,
    height: 20,
    marginRight: 6,
  },
  productName: {
    fontSize: 13,
    color: '#0066cc',
  },
  optionTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    justifyContent: 'center',
  },
  optionTag: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 4,
    marginBottom: 4,
  },
  pressOnlyTag: {
    backgroundColor: '#FFF3E0',
  },
  optionTagText: {
    fontSize: 10,
    color: '#1976D2',
  },
  notesContainer: {
    marginTop: 4,
  },
  notesLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#555',
  },
  notesText: {
    fontSize: 11,
    fontStyle: 'italic',
    color: '#666',
  },
  orderIdText: {
    fontSize: 11,
    color: '#757575',
    marginTop: 4,
  },
  itemActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  itemActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 6,
    marginLeft: 8,
  },
  itemActionText: {
    fontSize: 12,
    marginLeft: 4,
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    fontSize: 14,
    color: '#666',
  },
  printButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2196F3',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  disabledButton: {
    backgroundColor: '#B0BEC5',
  },
  printButtonText: {
    fontSize: 14,
    color: '#fff',
    marginLeft: 8,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default QRCodePrintModal;
