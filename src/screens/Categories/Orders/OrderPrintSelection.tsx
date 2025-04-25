import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Product } from '../../../types';
import QRCodePrintModal from '../../../components/QRCodePrintModal';
import { requestBluetoothPermissions } from '../../../utils/PermissionHandler';

interface OrderPrintSelectionProps {
  items: Product[];
  selectedItemIds: Set<string>;
  onToggleItem: (itemId: string) => void;
  customerName: string;
  orderId: string;
  onPrintComplete?: (success: boolean) => void;
}

const OrderPrintSelection: React.FC<OrderPrintSelectionProps> = ({
  items,
  selectedItemIds,
  onToggleItem,
  customerName,
  orderId,
  onPrintComplete
}) => {
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  // Only show selected items
  const selectedItems = items.filter(item => selectedItemIds.has(item._id));

  // Handle preview button click
  const handlePreview = async () => {
    if (selectedItemIds.size === 0) {
      Alert.alert('No Items Selected', 'Please select at least one item to print.');
      return;
    }
    
    // Check permissions before showing the modal
    try {
      const hasPermissions = await requestBluetoothPermissions();
      if (!hasPermissions) {
        Alert.alert(
          'Permission Required',
          'Bluetooth permissions are required to use the printer.'
        );
        return;
      }
      
      // Show preview modal
      setShowPreviewModal(true);
    } catch (error) {
      console.error('Error checking permissions:', error);
      Alert.alert('Error', 'Failed to check Bluetooth permissions.');
    }
  };

  // Toggle item selection
  const renderItemToggle = (item: Product) => {
    const isSelected = selectedItemIds.has(item._id);
    
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
          {item.name}
          {item.starch && ` (${item.starch})`}
          {item.pressOnly && ' (Press Only)'}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Select Items to Print</Text>
      
      {/* Item toggles */}
      <View style={styles.toggleContainer}>
        {items.map(renderItemToggle)}
      </View>
      
      {/* Action buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.previewButton,
            selectedItemIds.size === 0 && styles.disabledButton
          ]}
          onPress={handlePreview}
          disabled={selectedItemIds.size === 0 || isPrinting}
        >
          <Text style={styles.buttonText}>
            Preview QR Codes
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* QR Code Preview Modal */}
      <QRCodePrintModal
        visible={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        items={selectedItems}
        customerName={customerName}
        orderId={orderId}
        onPrintSuccess={() => {
          setShowPreviewModal(false);
          if (onPrintComplete) onPrintComplete(true);
        }}
        onPrintError={(error: any) => {
          console.error('Print error:', error);
          if (onPrintComplete) onPrintComplete(false);
        }}
      />
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
  previewButton: {
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
});

export default OrderPrintSelection;