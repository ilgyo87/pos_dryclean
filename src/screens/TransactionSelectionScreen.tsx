// src/screens/TransactionSelectionScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { useRoute, useNavigation, NavigationProp, ParamListBase, RouteProp } from '@react-navigation/native';

// Initialize Amplify client
const client = generateClient<Schema>();

// Customer interface
interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email?: string;
  address?: string;
}

// Transaction interface
interface Transaction {
  id: string;
  orderId: string;
  status: string;
  total: number;
  paymentMethod: string;
  pickupDate: string;
  customerID: string;
  businessID: string;
  // Other fields as needed
}

// Define type for route parameters
type TransactionSelectionScreenRouteParams = {
  customer: Customer;
  businessId: string;
};

// Define the route prop type
type TransactionSelectionRouteProp = RouteProp<
  { TransactionSelection: TransactionSelectionScreenRouteParams },
  'TransactionSelection'
>;

const TransactionSelectionScreen: React.FC = () => {
  const route = useRoute<TransactionSelectionRouteProp>();
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const { customer, businessId } = route.params;
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // State for order history
  const [orderHistory, setOrderHistory] = useState<Transaction[]>([]);
  
  // Function to generate a new order
  const createNewOrder = async (): Promise<void> => {
    // Navigate to the order details screen (to be created)
    navigation.navigate('OrderDetails', {
      customer,
      businessId,
      isNewOrder: true
    });
  };
  
  // Function to view order history
  const viewOrderHistory = async (): Promise<void> => {
    setIsLoading(true);
    try {
      // Fetch customer's order history
      const result = await client.models.Transaction.list({
        filter: {
          customerID: { eq: customer.id },
          businessID: { eq: businessId }
        }
      });
      
      if (result.data) {
        setOrderHistory(result.data as unknown as Transaction[]);
        // Navigate to history screen or expand in this screen
        Alert.alert('Feature Coming Soon', 'Order history view will be available in the next update.');
      }
    } catch (error) {
      console.error('Error fetching order history:', error);
      Alert.alert('Error', 'Failed to load order history.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      {/* Customer information header */}
      <View style={styles.customerInfoContainer}>
        <Text style={styles.customerName}>{customer.firstName} {customer.lastName}</Text>
        <Text style={styles.customerDetail}>{customer.phoneNumber}</Text>
        {customer.email && <Text style={styles.customerDetail}>{customer.email}</Text>}
        {customer.address && <Text style={styles.customerDetail}>{customer.address}</Text>}
      </View>
      
      {/* Action buttons */}
      <View style={styles.actionContainer}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.newOrderButton]} 
          onPress={createNewOrder}
        >
          <Text style={styles.actionButtonText}>New Order</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.historyButton]} 
          onPress={viewOrderHistory}
          disabled={isLoading}
        >
          <Text style={styles.actionButtonText}>View Order History</Text>
        </TouchableOpacity>
      </View>
      
      {/* This section will show recent orders or pending pickups */}
      <View style={styles.recentActivityContainer}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <View style={styles.activityPlaceholder}>
          <Text style={styles.placeholderText}>
            Customer's recent orders and pending pickups will appear here.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FB',
    padding: 16,
  },
  customerInfoContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  customerName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#0E2240',
  },
  customerDetail: {
    fontSize: 16,
    color: '#515C6B',
    marginBottom: 4,
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  newOrderButton: {
    backgroundColor: '#007AFF',
  },
  historyButton: {
    backgroundColor: '#5856D6',
  },
  actionButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  recentActivityContainer: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#0E2240',
  },
  activityPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    textAlign: 'center',
    color: '#8E8E93',
    fontSize: 16,
  }
});

export default TransactionSelectionScreen;