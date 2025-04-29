import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { OrderItem } from '../../../types';
import ViewShot from 'react-native-view-shot';
import QRItem from '../../../components/QRItem';
import IndividualLabelPrintService from '../../../utils/IndividualLabelPrintService';
import { requestBluetoothPermissions } from '../../../utils/PermissionHandler';

interface OrderPrintSelectionProps {
  items: OrderItem[];
  selectedItemIds: Set<string>;
  onToggleItem: (itemId: string) => void;
  customerName: string;
  orderId: string;
  onPrintComplete?: (success: boolean) => void;
}

/**
 * Component for selecting and printing label items with QR codes
 */
const OrderPrintSelection: React.FC<OrderPrintSelectionProps> = ({
  items,
  selectedItemIds,
  onToggleItem,
  customerName,
  orderId,
  onPrintComplete
}) => {
  const [isPrinting, setIsPrinting] = useState(false);
  const [printProgress, setPrintProgress] = useState({ current: 0, total: 0 });
  
  // Get only selected items
  const selectedItems = items.filter(item => selectedItemIds.has(item._id));
  
  // Create refs for all selected items (for capturing with ViewShot)
  const qrRefs = useRef<React.RefObject<ViewShot>[]>([]);
  
  // Update refs if selectedItems length changes
  useEffect(() => {
    qrRefs.current = Array(selectedItems.length)
      .fill(null)
      .map((_, i) => qrRefs.current[i] || React.createRef<ViewShot>());
  }, [selectedItems.length]);

  // Handle print button click
  const handlePrint = async () => {
    if (selectedItemIds.size === 0) {
      Alert.alert('No Items Selected', 'Please select at least one item to print.');
      return;
    }
    
    try {
      // First check for required permissions
      const hasPermissions = await requestBluetoothPermissions();
      if (!hasPermissions) {
        Alert.alert(
          'Permission Required',
          'Bluetooth permissions are required for printing. Please grant them in settings.'
        );
        return;
      }
      
      setIsPrinting(true);
      
      // Configure continuous printing for better label quality
      IndividualLabelPrintService.setConfig({
        paperSize: '29mm',
        labelLength: 90, // 90mm length
        margin: 2, // 2mm margin
        orientation: 'portrait',
        continuousPrint: true // Use continuous printing for better results
      });
      
      // Print the labels with progress updates
      // Map OrderItem[] to Product[] to satisfy printIndividualLabels
        const selectedProducts = selectedItems.map((item) => ({
          _id: item._id,
          name: item.productName || item.name,
          price: item.price ?? 0,
          discount: item.discount,
          additionalPrice: undefined,
          description: item.description,
          categoryId: item.category ?? '',
          businessId: item.businessId ?? '',
          customerId: item.customerId,
          employeeId: item.employeeId,
          orderId: item.orderId,
          orderItemId: item._id,
          starch: item.starch,
          pressOnly: item.pressOnly,
          imageName: undefined,
          imageUrl: undefined,
          notes: item.options?.notes ?? [],
          createdAt: new Date(),
          updatedAt: new Date(),
        }));
        const success = await IndividualLabelPrintService.printIndividualLabels(
          selectedProducts,
        customerName,
        orderId,
        qrRefs.current,
        (current, total) => {
          setPrintProgress({ current, total });
          console.log(`Printing progress: ${current} of ${total}`);
        }
      );
      
      if (success) {
        Alert.alert('Success', 'QR code labels printed successfully');
        if (onPrintComplete) onPrintComplete(true);
      } else {
        throw new Error('Failed to print one or more labels');
      }
    } catch (error) {
      console.error('Print error:', error);
      Alert.alert(
        'Print Error',
        'Failed to print QR code labels. Make sure your printer is connected and has paper.'
      );
      if (onPrintComplete) onPrintComplete(false);
    } finally {
      setIsPrinting(false);
      setPrintProgress({ current: 0, total: 0 });
    }
  };

  // Toggle item selection
  const renderItemToggle = (item: OrderItem) => {
    const isSelected = selectedItemIds.has(item._id);

    // Gather options from both top-level and item.options
    const optionStrings: string[] = [];
    if (item.starch || item.options?.starch) {
      const starchVal = item.starch || item.options?.starch;
      if (starchVal) optionStrings.push(`Starch: ${starchVal.charAt(0).toUpperCase() + starchVal.slice(1)}`);
    }
    if (item.pressOnly || item.options?.pressOnly) {
      optionStrings.push('Press Only');
    }
    if (item.options?.notes && Array.isArray(item.options.notes) && item.options.notes.length > 0) {
      optionStrings.push(`Notes: ${item.options.notes.join(', ')}`);
    }
    if (item.notes && Array.isArray(item.notes) && item.notes.length > 0) {
      optionStrings.push(`Notes: ${item.notes.join(', ')}`);
    }
    // Add any additional options fields here as needed

    return (
      <TouchableOpacity
        key={item._id}
        style={[
          styles.itemToggle,
          isSelected ? styles.itemToggleSelected : styles.itemToggleUnselected
        ]}
        onPress={() => onToggleItem(item._id)}
      >
        <Text
          style={[
            styles.itemToggleText,
            isSelected ? styles.itemToggleTextSelected : styles.itemToggleTextUnselected
          ]}
        >
          {item.productName || item.name}
        </Text>
        {/* Always show details, even if some are missing */}
        <View style={{ marginTop: 2 }}>
          <Text style={[styles.itemToggleText, { fontSize: 12, color: '#888' }]}>Starch: {item.starch || item.options?.starch || '-'}</Text>
          <Text style={[styles.itemToggleText, { fontSize: 12, color: '#888' }]}>Press Only: {(item.pressOnly || item.options?.pressOnly) ? 'Yes' : 'No'}</Text>
          {(item.notes && item.notes.length > 0) || (item.options?.notes && item.options.notes.length > 0) ? (
            <Text style={[styles.itemToggleText, { fontSize: 12, color: '#888' }]}>Notes: {(item.notes && item.notes.length > 0) ? item.notes.join(', ') : item.options?.notes?.join(', ')}</Text>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Select Items to Print</Text>
      
      {/* Item toggles */}
      <View style={styles.toggleContainer}>
        {items.map(item => renderItemToggle({
          ...item,
          name: item.productName || item.name
        }))}
      </View>
      
      {/* Action buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.printButton,
            (selectedItemIds.size === 0 || isPrinting) && styles.disabledButton
          ]}
          onPress={handlePrint}
          disabled={selectedItemIds.size === 0 || isPrinting}
        >
          {isPrinting ? (
            <View style={styles.printingContainer}>
              <ActivityIndicator size="small" color="#ffffff" style={styles.activityIndicator} />
              <Text style={styles.buttonText}>
                {printProgress.current > 0 
                  ? `Printing ${printProgress.current}/${printProgress.total}...` 
                  : 'Preparing...'}
              </Text>
            </View>
          ) : (
            <Text style={styles.buttonText}>
              Print Barcodes ({selectedItemIds.size})
            </Text>
          )}
        </TouchableOpacity>
      </View>
      
      {/* Hidden QR codes for printing - will be captured with ViewShot */}
      <View style={styles.hiddenQRContainer}>
        {selectedItems.map((item, idx) => {
          // Patch: ensure all Product fields exist
          const productLike = {
            ...item,
            name: item.productName || item.name,
            categoryId: (item as any).categoryId || '',
            createdAt: (item as any).createdAt || new Date(),
            updatedAt: (item as any).updatedAt || new Date(),
            price: typeof item.price === 'number' ? item.price : 0, // Product expects price: number
            notes: item.notes || [], // Product expects notes: string[]
            businessId: item.businessId || '', // Product expects businessId: string
          };
          return (
            <QRItem
              key={item._id}
              item={productLike}
              customerName={customerName}
              orderId={orderId}
              viewShotRef={qrRefs.current[idx]}
              itemIndex={idx}
              totalItems={selectedItems.length}
            />
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  toggleContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  itemToggle: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    margin: 4,
    borderWidth: 1,
  },
  itemToggleSelected: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196F3',
  },
  itemToggleUnselected: {
    backgroundColor: '#f5f5f5',
    borderColor: '#ddd',
  },
  itemToggleText: {
    fontSize: 14,
    fontWeight: '500',
  },
  itemToggleTextSelected: {
    color: '#0d47a1',
  },
  itemToggleTextUnselected: {
    color: '#666',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  printButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 200,
  },
  disabledButton: {
    backgroundColor: '#cccccc',
    opacity: 0.7,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  printingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityIndicator: {
    marginRight: 8,
  },
  hiddenQRContainer: {
    position: 'absolute',
    left: -9999,
    top: -9999,
    opacity: 0,
    width: 1,
    height: 1,
    overflow: 'hidden',
  },
});

export default OrderPrintSelection;