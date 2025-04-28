// src/components/QRCodePrintModal.tsx
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
  const navigation = useNavigation<any>();

  // Refs for view-shot (one per item)
  const viewShotRefs = useRef<React.RefObject<ViewShot>[]>([]);
  useEffect(() => {
    // Sync refs with items
    if (items.length !== viewShotRefs.current.length) {
      viewShotRefs.current = items.map(() => React.createRef());
    }
  }, [items]);

  // Handle print action using expo-print (AirPrint)
  const handlePrint = async () => {
    if (items.length === 0) {
      Alert.alert('Error', 'No items to print');
      return;
    }

    try {
      setIsLoading(true);
      
      // Dynamically import expo modules
      const Print = await import('expo-print');
      const FileSystem = await import('expo-file-system');
      
      // Generate HTML for printing
      let html = `
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
        <style>
          body {
            font-family: Helvetica, Arial, sans-serif;
            padding: 10px;
          }
          .qr-label {
            display: flex;
            align-items: center;
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 12px;
            margin-bottom: 16px;
            page-break-inside: avoid;
          }
          .qr-image {
            margin-right: 15px;
          }
          .customer-name {
            font-weight: bold;
            font-size: 14px;
            margin-bottom: 4px;
          }
          .product-name {
            font-size: 13px;
            color: #0066cc;
            margin-bottom: 4px;
          }
          .option-tag {
            display: inline-block;
            background-color: #E3F2FD;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 10px;
            margin-right: 4px;
            margin-bottom: 4px;
            color: #1976D2;
          }
          .press-only-tag {
            background-color: #FFF3E0;
          }
          .notes {
            font-style: italic;
            font-size: 11px;
            color: #666;
            margin-bottom: 4px;
          }
          .order-id {
            font-size: 11px;
            color: #757575;
          }
        </style>
      </head>
      <body>
        <h2>QR Code Labels</h2>
      `;

      // Process each item
      for (const item of items) {
        try {
          // Generate QR code data
          const qrData = generateQRCodeData('Product', {
            id: item._id,
            orderItemId: item.orderItemId || item._id,
            orderId: orderId || '',
            customerId: item.customerId || '',
            businessId: item.businessId || '',
          });
          
          // Get QR code image
          const itemIndex = items.indexOf(item);
          const ref = viewShotRefs.current[itemIndex];
          if (!ref || !ref.current) {
            console.error('ViewShot ref not available for item', itemIndex);
            continue;
          }
          
          // Capture QR code image
          const imageUri = await captureRef(ref, { format: 'png', quality: 1 });
          const base64 = await FileSystem.readAsStringAsync(imageUri, { encoding: FileSystem.EncodingType.Base64 });
          
          // Add item to HTML
          html += `
          <div class="qr-label">
            <div class="qr-image">
              <img src="data:image/png;base64,${base64}" width="90" height="90" />
            </div>
            <div>
              <div class="customer-name">${customerName || 'Customer'}</div>
              <div class="product-name">${item.name || 'No Product Name'}</div>
              <div>
                ${item.starch && item.starch !== 'none' ? 
                  `<span class="option-tag">${formatStarch(item.starch)}</span>` : ''}
                ${item.pressOnly ? 
                  `<span class="option-tag press-only-tag">Press Only</span>` : ''}
              </div>
              ${item.notes && item.notes.length > 0 ? 
                `<div class="notes">Notes: ${item.notes[0]}</div>` : ''}
              <div class="order-id">Order: #${orderId.substring(0, 8)}</div>
            </div>
          </div>
          `;
        } catch (error) {
          console.error('Error processing item for print:', error);
        }
      }
      
      // Close HTML
      html += `</body></html>`;
      
      // Print using AirPrint
      await Print.printAsync({
        html,
        printerUrl: undefined, // Let the OS choose the printer
      });
      
      // If we get here without error, printing was successful
      if (onPrintSuccess) onPrintSuccess();
      
      // Show success message
      Alert.alert('Success', 'QR labels printed successfully');
      
      // Notify on completion
      if (onPrintComplete) onPrintComplete(true);
    } catch (error) {
      console.error('Print error:', error);
      if (onPrintError) onPrintError(error as Error);
      Alert.alert('Print Error', `Failed to print QR codes: ${error}`);
      
      // Notify on completion
      if (onPrintComplete) onPrintComplete(false);
    } finally {
      setIsLoading(false);
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
                  <Text style={styles.printButtonText}>Printing...</Text>
                </View>
              ) : (
                <>
                  <MaterialIcons name="print" size={18} color="#fff" />
                  <Text style={styles.printButtonText}>Print QR Labels</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
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
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    flexDirection: 'row',
  },
  qrBox: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  qrLeftSection: {
    alignItems: 'center',
    marginRight: 16,
  },
  optionTags: {
    marginTop: 8,
    alignItems: 'center',
  },
  optionTag: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 4,
  },
  pressOnlyTag: {
    backgroundColor: '#FFF3E0',
  },
  optionTagText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#1976D2',
  },
  qrInfoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  customerName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  productImage: {
    width: 24,
    height: 24,
    marginRight: 8,
  },
  productName: {
    fontSize: 16,
    color: '#0066cc',
    fontWeight: '500',
  },
  notesContainer: {
    marginBottom: 8,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#555',
  },
  notesText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  orderIdText: {
    fontSize: 12,
    color: '#757575',
  },
  itemActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: 8,
  },
  itemActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginLeft: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
  },
  itemActionText: {
    fontSize: 12,
    marginLeft: 4,
    color: '#333',
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
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
    paddingHorizontal: 20,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
  },
  printButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  printButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
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

export default QRCodePrintModal;