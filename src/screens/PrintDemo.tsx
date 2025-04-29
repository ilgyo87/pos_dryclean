import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Alert, TouchableOpacity } from 'react-native';
import OrderPrintSelection from './Categories/Orders/OrderPrintSelection';
import { Product } from '../types';

/**
 * Demo screen to show how to use QR code printing functionality
 */
const PrintDemo: React.FC = () => {
  // Sample order data
  const [order] = useState({
    _id: '123456789abcdef',
    customerName: 'John Smith',
    status: 'CREATED',
    items: [
      {
        _id: 'item1',
        name: 'Dress Shirt',
        price: 5.99,
        starch: 'medium' as any,
        pressOnly: false,
        categoryId: 'shirts',
        businessId: 'business123',
        notes: [],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: 'item2',
        name: 'Suit Pants',
        price: 8.99,
        starch: null,
        pressOnly: true,
        categoryId: 'pants',
        businessId: 'business123',
        notes: [],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: 'item3',
        name: 'Cotton Jacket',
        price: 12.99,
        starch: null,
        pressOnly: false,
        categoryId: 'jackets',
        businessId: 'business123',
        notes: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ] as Product[]
  });

  // State to track selected items
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(
    new Set(order.items.map(item => item._id))
  );

  // Toggle item selection
  const handleToggleItem = (itemId: string) => {
    setSelectedItemIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  // Handle print completion
  const handlePrintComplete = (success: boolean) => {
    if (success) {
      Alert.alert('Success', 'All items printed successfully!');
    } else {
      Alert.alert('Error', 'There was a problem printing some or all items.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>QR Code Label Printing</Text>
        
        <View style={styles.orderInfo}>
          <Text style={styles.orderNumber}>Order #{order._id.substring(0, 8)}</Text>
          <Text style={styles.customerName}>{order.customerName}</Text>
          <Text style={styles.itemCount}>{order.items.length} items</Text>
        </View>
        
        <View style={styles.divider} />
        
        <Text style={styles.sectionTitle}>Print Order QR Codes</Text>
        <Text style={styles.description}>
          Select which items you want to print QR code labels for. The labels will include 
          product details, customer information, and a QR code that can be scanned for tracking.
        </Text>
        
        {/* Print selection component */}
        <OrderPrintSelection
          items={order.items}
          selectedItemIds={selectedItemIds}
          onToggleItem={handleToggleItem}
          customerName={order.customerName}
          orderId={order._id}
          onPrintComplete={handlePrintComplete}
        />
        
        <View style={styles.divider} />
        
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>About Printing</Text>
          <Text style={styles.infoText}>
            Labels are formatted for 29mm x 90mm continuous roll labels and will print on 
            the configured printer. Make sure your printer is properly connected and has 
            the correct label size loaded.
          </Text>
          
          <TouchableOpacity
            style={styles.printerSetupButton}
            onPress={() => Alert.alert('Navigate', 'This would navigate to printer setup')}
          >
            <Text style={styles.printerSetupButtonText}>
              Printer Setup
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  orderInfo: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  customerName: {
    fontSize: 16,
    marginBottom: 8,
    color: '#555',
  },
  itemCount: {
    fontSize: 14,
    color: '#666',
  },
  divider: {
    height: 1,
    backgroundColor: '#ddd',
    marginVertical: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: '#666',
    marginBottom: 16,
  },
  infoSection: {
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    padding: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#0d47a1',
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
    marginBottom: 16,
  },
  printerSetupButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  printerSetupButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default PrintDemo;