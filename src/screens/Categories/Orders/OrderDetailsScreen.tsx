// Example of how to integrate barcode ticketing in an Order Details screen

import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Alert,
  ScrollView,
  SafeAreaView
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Order, Product } from '../../../types';
import { useOrders } from '../../../hooks/useOrders';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import BarcodeTicketingScreen from '../Orders/BarcodeTicketingScreen';
import { updateOrderAfterTicketing } from '../../../utils/OrderBarcodeUtils';

// Example Order Details screen component
export default function OrderDetailsScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { orders, updateStatus, refetch } = useOrders();
  
  // Get the order ID from route params
  const orderId = route.params?.orderId;
  
  // Find the order in the orders array
  const order = orders.find(o => o._id === orderId);
  
  // State for barcode ticketing modal
  const [showBarcodeTicketing, setShowBarcodeTicketing] = useState(false);
  
  // Return early if order not found
  if (!order) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={48} color="#F44336" />
          <Text style={styles.errorText}>Order not found</Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  
  // Function to start barcode ticketing process
  const handleStartBarcodeTicketing = () => {
    if (order.status !== 'CREATED') {
      Alert.alert(
        'Invalid Status',
        'Only orders with "CREATED" status can be processed for barcode ticketing.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    setShowBarcodeTicketing(true);
  };
  
  // Function to handle completion of barcode ticketing
  const handleBarcodeTicketingComplete = async (updatedItems: Product[]) => {
    try {
      // Update order status to PROCESSING
      const success = await updateOrderAfterTicketing(
        order._id,
        updatedItems,
        'PROCESSING'
      );
      
      if (success) {
        Alert.alert(
          'Success',
          'All items have been ticketed and the order status has been updated.',
          [
            { 
              text: 'OK', 
              onPress: () => {
                refetch();
                setShowBarcodeTicketing(false);
              }
            }
          ]
        );
      } else {
        Alert.alert(
          'Error',
          'Failed to update order status. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error completing barcode ticketing:', error);
      Alert.alert(
        'Error',
        'An unexpected error occurred. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Details</Text>
        <View style={styles.placeholder} />
      </View>
      
      <ScrollView contentContainerStyle={styles.content}>
        {/* Order Info Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Order Information</Text>
            <View style={styles.orderStatusBadge}>
              <Text style={styles.orderStatusText}>{order.status}</Text>
            </View>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Order ID:</Text>
            <Text style={styles.infoValue}>{order._id}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Customer:</Text>
            <Text style={styles.infoValue}>{order.customerName || order.customerId}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Created:</Text>
            <Text style={styles.infoValue}>{new Date(order.createdAt).toLocaleString()}</Text>
          </View>
          
          {order.pickupDate && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Pickup:</Text>
              <Text style={styles.infoValue}>{new Date(order.pickupDate).toLocaleString()}</Text>
            </View>
          )}
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Total:</Text>
            <Text style={styles.infoValue}>${order.total.toFixed(2)}</Text>
          </View>
        </View>
        
        {/* Items Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Items</Text>
            <Text style={styles.itemCount}>{order.items.length} items</Text>
          </View>
          
          {order.items.map(item => (
            <View key={item._id} style={styles.itemRow}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
            </View>
          ))}
        </View>
        
        {/* Actions Section */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Actions</Text>
          
          {/* Only show Ticket Items button if order is in CREATED status */}
          {order.status === 'CREATED' && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleStartBarcodeTicketing}
            >
              <MaterialIcons name="qr-code" size={24} color="#fff" />
              <Text style={styles.actionButtonText}>Print & Scan Barcodes</Text>
            </TouchableOpacity>
          )}
          
          {/* Other action buttons would go here */}
        </View>
      </ScrollView>
      
      {/* Barcode Ticketing Modal */}
      {showBarcodeTicketing && (
        <BarcodeTicketingScreen
          orderId={order._id}
          items={order.items}
          customerName={order.customerName || 'Customer'}
          customerId={order.customerId}
          onComplete={handleBarcodeTicketingComplete}
          onCancel={() => setShowBarcodeTicketing(false)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: '#2196F3',
    fontWeight: '500',
  },
  placeholder: {
    width: 40,
  },
  content: {
    padding: 16,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  orderStatusBadge: {
    backgroundColor: '#E3F2FD',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 16,
  },
  orderStatusText: {
    color: '#1976D2',
    fontWeight: '500',
    fontSize: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  infoValue: {
    color: '#333',
    fontSize: 14,
  },
  itemCount: {
    color: '#666',
    fontSize: 14,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemName: {
    fontSize: 14,
    color: '#333',
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  actionsSection: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 16,
    marginLeft: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
    marginBottom: 16,
  },
});