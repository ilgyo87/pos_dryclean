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
  Switch,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Product } from '../types';
import ViewShot from 'react-native-view-shot';
import Share from 'react-native-share';
import { CameraRoll } from '@react-native-camera-roll/camera-roll';

// Import the updated QRItem component
import QRItem from './QRItem';

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
  const [continuousPrint, setContinuousPrint] = useState(true); // Default to continuous printing for vertical stacking

  // Refs for view-shot (one per item)
  const viewShotRefs = useRef<React.RefObject<ViewShot>[]>([]);
  
  // Track if mounted
  const isMounted = useRef(true);
  
  useEffect(() => {
    // Sync refs with items
    if (items.length !== viewShotRefs.current.length) {
      viewShotRefs.current = items.map(() => React.createRef());
    }
    
    // Clean up on unmount
    return () => {
      isMounted.current = false;
    };
  }, [items]);

  // Handle print action with progress tracking
  const handlePrint = async () => {
    if (items.length === 0) {
      Alert.alert('Error', 'No items to print');
      return;
    }

    try {
      setIsLoading(true);
      setPrintProgress({ current: 0, total: items.length * 2 }); // Double for capture + print
      
      // Import the IndividualLabelPrintService
      const { default: IndividualLabelPrintService } = await import('../utils/IndividualLabelPrintService');
      
      // Configure continuous printing
      IndividualLabelPrintService.setConfig({
        paperSize: '29mm',
        labelLength: 90,
        margin: 1, // Reduced margin for bigger content
        orientation: 'portrait',
        continuousPrint: continuousPrint
      });
      
      // Print all selected items
      const success = await IndividualLabelPrintService.printIndividualLabels(
        items,
        customerName,
        orderId,
        viewShotRefs.current,
        (current, total) => {
          // Update progress in UI if component is still mounted
          if (isMounted.current) {
            setPrintProgress({ current, total });
            console.log(`Printing progress: ${current}/${total}`);
          }
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
      
      // Show user-friendly error message
      Alert.alert(
        'Print Error', 
        Platform.OS === 'ios'
          ? 'Failed to print QR codes. Make sure your printer is connected and has paper.'
          : `Failed to print QR codes: ${error}`
      );
      
      // Notify on completion
      if (onPrintComplete) onPrintComplete(false);
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
        setPrintProgress({ current: 0, total: 0 });
      }
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
                {/* Print options section */}
                <View style={styles.printerOptionsContainer}>
                  <Text style={styles.sectionTitle}>Print Options</Text>
                  
                  <View style={styles.printOptionRow}>
                    <Text style={styles.printOptionLabel}>Print vertically as continuous label</Text>
                    <Switch
                      value={continuousPrint}
                      onValueChange={setContinuousPrint}
                      trackColor={{ false: '#ccc', true: '#bfe3ff' }}
                      thumbColor={continuousPrint ? '#2196F3' : '#f4f3f4'}
                    />
                  </View>
                  
                  <Text style={styles.optionHelperText}>
                    {continuousPrint 
                      ? "All labels will print vertically stacked on one continuous strip"
                      : "Labels will print as separate individual labels (not recommended)"}
                  </Text>
                </View>
                
                {/* Labels section */}
                <Text style={styles.sectionTitle}>
                  Labels to Print ({items.length})
                </Text>
                
                {/* QR code items - vertical layout optimized for 29x90mm */}
                <View style={styles.labelsGrid}>
                  {items.map((item, idx) => (
                    <View key={item._id + idx} style={styles.labelItem}>
                      <QRItem
                        item={item}
                        customerName={customerName}
                        orderId={orderId}
                        viewShotRef={viewShotRefs.current[idx]}
                        itemIndex={idx}
                        totalItems={items.length}
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
                </View>
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
                      ? `${printProgress.current}/${printProgress.total}...` 
                      : 'Printing...'}
                  </Text>
                </View>
              ) : (
                <>
                  <MaterialIcons name="print" size={18} color="#fff" />
                  <Text style={styles.printButtonText}>Print All Labels</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Updated styles for vertical layout and continuous printing
const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 700,
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
  printerOptionsContainer: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  printOptionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
  },
  printOptionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  optionHelperText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  labelsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  labelItem: {
    width: '48%', // Adjust based on your design needs
    marginBottom: 16,
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
  },
  itemActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  itemActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 6,
  },
  itemActionText: {
    fontSize: 12,
    marginLeft: 4,
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