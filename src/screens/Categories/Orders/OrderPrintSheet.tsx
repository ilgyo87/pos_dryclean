import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { generateQRCodeData } from '../../../utils/QRCodeGenerator';
import BrotherPrinterService from '../../../utils/BrotherPrinterService';
import { requestBluetoothPermissions } from '../../../utils/PermissionHandler';
import { Product } from '../../../types';
import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system';

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
          // Print QR codes and order info to a regular printer using expo-print
          for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const qrData = generateQRCodeData('Product', {
              id: item._id,
              orderItemId: item.orderItemId || item._id,
              orderId: item.orderId || '',
              customerId: item.customerId || '',
              businessId: item.businessId || '',
            });
            const { generateQRCodeImage } = await import('../../../utils/QRCodeLabelHelper');
            let imageUri: string;
            try {
              imageUri = await generateQRCodeImage(qrData);
              // Convert local file URI to base64 for embedding in HTML
              const base64 = await FileSystem.readAsStringAsync(imageUri, { encoding: FileSystem.EncodingType.Base64 });
              // Print each QR code as its own print job (one per page/label)
              const html = `
                <html>
                  <head>
                    <style>
                      @page {
                        size: 29mm 90mm;
                        margin: 0;
                      }
                      body {
                        width: 29mm;
                        height: 90mm;
                        margin: 0;
                        padding: 0;
                        display: flex;
                        align-items: center;
                        justify-content: flex-start;
                      }
                      .qr-label {
                        width: 29mm;
                        height: 90mm;
                        display: flex;
                        align-items: center;
                        justify-content: flex-start;
                      }
                    </style>
                  </head>
                  <body>
                    <div class="qr-label">
                      <img src="data:image/png;base64,${base64}" width="100" height="100" style="margin-right:8px;border:1px solid #ccc;border-radius:8px;" />
                      <div>
                        <div style="font-weight:bold;font-size:14px;">${customerName || 'No Customer Name'}</div>
                        <div style="font-size:13px;">${item.name || 'No Product Name'}</div>
                        <div style="font-size:12px;color:#888;">Order: ${item.orderId || orderId || ''}</div>
                      </div>
                    </div>
                  </body>
                </html>
              `;
              await Print.printAsync({ html });
            } catch (err) {
              console.error('Failed to print QR code label:', err);
              continue;
            }
          }
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
