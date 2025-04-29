// src/utils/QRItem.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Product } from '../types';

interface QRItemProps {
  item: Product;
  customerName: string;
  orderId: string;
  viewShotRef: React.RefObject<any>;
  itemIndex?: number;
  totalItems?: number;
}

const QRItem: React.FC<QRItemProps> = ({
  item,
  customerName,
  orderId,
  viewShotRef,
  itemIndex,
  totalItems
}) => {
  // Generate QR code data (simplified for this example)
  const qrData = JSON.stringify({
    id: item._id,
    orderItemId: item.orderItemId || item._id,
    orderId: orderId,
    customerId: item.customerId || '',
    businessId: item.businessId || '',
  });

  return (
    <View 
      ref={viewShotRef} 
      style={styles.container}
      collapsable={false} // Important for ViewShot to work
    >
      {/* Clothing icon or product type indicator */}
      <Text style={styles.icon}>👕</Text>
      
      {/* Product name with options */}
      <Text style={styles.productName} numberOfLines={2} ellipsizeMode="tail">
        {item.name || 'No Product Name'}
        {item.starch && ` (${item.starch})`}
        {item.pressOnly && ' (Press Only)'}
      </Text>
      
      {/* QR code */}
      <View style={styles.qrContainer}>
        <QRCode
          value={qrData}
          size={90}
          backgroundColor="white"
          color="black"
        />
      </View>
      
      {/* Customer name */}
      <Text style={styles.customerName} numberOfLines={1} ellipsizeMode="tail">
        {customerName || 'No Customer'}
      </Text>
      
      {/* Optional item counter (x of y) */}
      {(itemIndex !== undefined && totalItems) && (
        <Text style={styles.counterText}>
          {itemIndex + 1} of {totalItems}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 280, // Width for printing at 29mm
    height: 720, // Height for 90mm label
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  icon: {
    fontSize: 30,
    marginBottom: 8,
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
    width: '100%',
  },
  qrContainer: {
    margin: 8,
    padding: 5,
    backgroundColor: 'white',
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    width: '100%',
    textAlign: 'center',
  },
  counterText: {
    fontSize: 12,
    color: '#777',
    marginTop: 5,
  }
});

export default QRItem;