// src/components/QRItem.tsx
import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { generateQRCodeData } from '../utils/QRCodeGenerator';
import { Product } from '../types';
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
  itemIndex?: number; // Add index for showing position in batch
  totalItems?: number; // Add total for showing position in batch
}

// QRItem component with vertical orientation for label printing
const QRItem: React.FC<QRItemProps> = ({ 
  item, 
  customerName, 
  orderId, 
  viewShotRef,
  itemIndex,
  totalItems 
}) => {
  // Generate QR code data
  const qrValue = generateQRCodeData('Product', {
    id: item._id,
    orderItemId: item.orderItemId || item._id,
    orderId: orderId || '',
    customerId: item.customerId || '',
    businessId: item.businessId || '',
  });

  // Create label counter text (e.g., "1 of 5")
  const labelCounter = (itemIndex !== undefined && totalItems) 
    ? `${itemIndex + 1} of ${totalItems}` 
    : '';

  return (
    <View style={styles.qrItemContainer}>
      <View ref={viewShotRef} style={styles.qrVerticalBox}>
        {/* Customer Name at the top */}
        <Text style={styles.customerName}>{customerName || 'Customer'}</Text>
        
        {/* Product name with image */}
        <View style={styles.productSection}>
          <Image 
            source={getGarmentImage(item.imageName || 'default')} 
            style={styles.productImage} 
            resizeMode="contain"
          />
          <Text style={styles.productName}>{item.name || 'No Product Name'}</Text>
        </View>
        
        {/* QR Code centered */}
        <View style={styles.qrCodeSection}>
          <QRCode
            value={qrValue}
            size={160}
            backgroundColor="#ffffff"
          />
        </View>
        
        {/* Option Tags */}
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
        
        {/* Notes Section */}
        {item.notes && item.notes.length > 0 && (
          <View style={styles.notesContainer}>
            <Text style={styles.notesText} numberOfLines={2}>
              Note: {item.notes[0]}
            </Text>
          </View>
        )}
        
        {/* Order ID and label counter */}
        <View style={styles.footerContainer}>
          <Text style={styles.orderIdText}>Order: #{orderId.substring(0, 8)}</Text>
          {labelCounter && <Text style={styles.labelCounterText}>{labelCounter}</Text>}
        </View>
      </View>
    </View>
  );
};

// Styles optimized for a 29x90mm vertical label
const styles = StyleSheet.create({
  qrItemContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    // Set width to match 29mm approximately
    width: '100%',
  },
  qrVerticalBox: {
    padding: 8, // Reduced padding for more space
    flexDirection: 'column',
    alignItems: 'center',
    // Enforce 29x90mm aspect ratio
    aspectRatio: 1, // 29/90
    width: '100%',
    backgroundColor: '#ffffff',
  },
  customerName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4, // Reduced margin
    textAlign: 'center',
    width: '100%',
  },
  productSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4, // Reduced margin
    justifyContent: 'center',
    width: '100%',
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
  qrCodeSection: {
    marginVertical: 6, // Reduced vertical margin
    alignItems: 'center',
    width: '100%',
  },
  optionTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginVertical: 4, // Reduced margin
    width: '100%',
  },
  optionTag: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 2, // Reduced padding
    borderRadius: 4,
    marginHorizontal: 4,
    marginBottom: 2, // Reduced margin
  },
  pressOnlyTag: {
    backgroundColor: '#FFF3E0',
  },
  optionTagText: {
    fontSize: 12,
    color: '#1976D2',
    fontWeight: '500',
  },
  notesContainer: {
    width: '100%',
    marginTop: 2, // Reduced margin
    marginBottom: 4, // Reduced margin
    padding: 4, // Reduced padding
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
  },
  notesText: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#666',
    textAlign: 'center',
  },
  footerContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4, // Reduced margin
  },
  orderIdText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  labelCounterText: {
    fontSize: 12,
    color: '#666',
  },
});

export default QRItem;