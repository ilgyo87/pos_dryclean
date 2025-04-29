import React, { forwardRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Barcode from '@kichiyaki/react-native-barcode-generator';
import { Product } from '../types';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

interface BarcodeItemProps {
  item: Product;
  customerName: string;
  barcodeValue: string;
  isScanned?: boolean;
}

// Component to display a barcode item with scanning status
const BarcodeItem = forwardRef<View, BarcodeItemProps>(
  ({ item, customerName, barcodeValue, isScanned = false }, ref) => {
    // Determine icon based on product type or optional values
    const getItemIcon = () => {
      if (item.name?.toLowerCase().includes('shirt')) {
        return '👔';
      } else if (item.name?.toLowerCase().includes('pants') || item.name?.toLowerCase().includes('trouser')) {
        return '👖';
      } else if (item.name?.toLowerCase().includes('dress')) {
        return '👗';
      } else if (item.name?.toLowerCase().includes('jacket') || item.name?.toLowerCase().includes('coat')) {
        return '🧥';
      } else if (item.name?.toLowerCase().includes('suit')) {
        return '🕴️';
      } else {
        return '👕'; // Default clothing icon
      }
    };
    
    return (
      <View ref={ref} style={[styles.container, isScanned && styles.scannedContainer]}>
        <View style={styles.leftSection}>
          <Text style={styles.icon}>{getItemIcon()}</Text>
        </View>
        
        <View style={styles.middleSection}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.customerName}>{customerName}</Text>
          
          <View style={styles.barcodeWrapper}>
            <Barcode 
              format="CODE128"
              value={barcodeValue}
              text={barcodeValue}
              maxWidth={220}
              height={70}
            />
          </View>
          
          {item.starch && (
            <Text style={styles.optionText}>Starch: {item.starch}</Text>
          )}
          
          {item.pressOnly && (
            <Text style={styles.optionText}>Press Only</Text>
          )}
        </View>
        
        <View style={styles.rightSection}>
          {isScanned ? (
            <MaterialIcons name="check-circle" size={24} color="#4CAF50" />
          ) : (
            <MaterialIcons name="radio-button-unchecked" size={24} color="#999" />
          )}
        </View>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
    borderLeftWidth: 3,
    borderLeftColor: '#ddd',
  },
  scannedContainer: {
    borderLeftColor: '#4CAF50',
  },
  leftSection: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 40,
  },
  middleSection: {
    flex: 1,
    paddingHorizontal: 8,
  },
  rightSection: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 40,
  },
  icon: {
    fontSize: 24,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  customerName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  barcodeWrapper: {
    marginVertical: 8,
  },
  optionText: {
    fontSize: 12,
    color: '#555',
    fontStyle: 'italic',
  },
});

export default BarcodeItem;