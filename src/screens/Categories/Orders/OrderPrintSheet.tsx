import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { generateQRCodeData } from '../../../utils/QRCodeGenerator';
import phomemoPrinter from '../../../utils/PhomemoIntegration';
import { requestBluetoothPermissions } from '../../../utils/PermissionHandler';
import { Product } from '../../../types';

interface OrderPrintSheetProps {
  items: Product[];
  customerName: string;
  orderId: string;
}

const OrderPrintSheet: React.FC<OrderPrintSheetProps> = ({ items, customerName, orderId }) => {
  return (
    <View style={styles.sheetContainer}>
      <TouchableOpacity
        style={styles.printButton}
        onPress={async () => {
          const hasPerm = await requestBluetoothPermissions();
          if (!hasPerm) return;
          await phomemoPrinter.printQRCodes(items, customerName, orderId);
        }}
      >
        <Text style={styles.printButtonText}>Print</Text>
      </TouchableOpacity>
      {items.map(item => (
        <View key={item._id} style={styles.row}>
          <View style={styles.qrBox}>
            <QRCode
              value={generateQRCodeData('Product', {
                id: item._id,
                orderItemId: item.orderItemId || item._id,
                orderId: item.orderId || '',
                customerId: item.customerId || '',
                businessId: item.businessId || '',
              })}
              size={72}
            />
          </View>
          <View style={styles.infoRight}>
            <Text style={styles.customerName}>{customerName || 'No Customer Name'}</Text>
            <Text style={styles.productName}>{item.name || 'No Product Name'}</Text>
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  sheetContainer: {
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
    backgroundColor: '#f5f8fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  infoRight: {
    marginLeft: 9,
    justifyContent: 'center',
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  qrBox: {
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  customerName: {
    fontWeight: 'bold',
    fontSize: 12,
    marginBottom: 2,
    color: '#222',
  },
  productName: {
    fontSize: 11,
    color: '#1976D2',
    fontWeight: '600',
    marginBottom: 1,
  },
  printButton: {
    backgroundColor: '#1976D2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  printButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default OrderPrintSheet;
