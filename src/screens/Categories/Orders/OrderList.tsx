import React from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import OrderCard from './OrderCard';
import { Order } from '../../../types';
import type { OrderStatus } from './StatusHeaderBar';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

interface OrderListProps {
  orders: Order[];
  isLoading: boolean;
  error: string | null;
  selectedStatus: OrderStatus;
  onRefresh: () => void;
  onOrderSelect: (order: Order) => void;
}

const OrderList: React.FC<OrderListProps> = ({ 
  orders, 
  isLoading, 
  error, 
  selectedStatus,
  onRefresh,
  onOrderSelect
}) => {
  // Filter orders by selected status
  const filteredOrders = React.useMemo(() => {
    if (selectedStatus === 'ALL') {
      return orders;
    }
    return orders.filter(order => order.status === selectedStatus);
  }, [orders, selectedStatus]);
  
  // Sort orders by creation date (newest first)
  const sortedOrders = React.useMemo(() => {
    return [...filteredOrders].sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [filteredOrders]);
  
  if (isLoading && orders.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }
  
  if (error && orders.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Error loading orders</Text>
        <Text>{error}</Text>
      </View>
    );
  }
  
  if (sortedOrders.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <MaterialIcons name="receipt-long" size={50} color="#ccc" />
        <Text style={styles.emptyText}>
          {selectedStatus === 'ALL' 
            ? 'No orders found' 
            : `No ${selectedStatus.toLowerCase()} orders`
          }
        </Text>
      </View>
    );
  }
  
  return (
    <FlatList
      data={sortedOrders}
      keyExtractor={item => item._id}
      renderItem={({ item }) => (
        <OrderCard 
          order={item} 
          onPress={onOrderSelect}
        />
      )}
      contentContainerStyle={styles.listContent}
      refreshControl={
        <RefreshControl 
          refreshing={isLoading} 
          onRefresh={onRefresh} 
        />
      }
    />
  );
};

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#d9534f',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
  listContent: {
    padding: 16,
    paddingBottom: 80, // Extra space for FAB or bottom navigation
  },
});

export default OrderList;