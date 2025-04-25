// src/screens/OrderManagement.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import PrinterService from '../../../utils/PrinterService';

// Order status enum
enum OrderStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  READY = 'ready',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

// Order type definition
interface Order {
  id: string;
  customerId: string;
  customerName?: string;
  items: any[];
  total: number;
  status: OrderStatus;
  createdAt: Date;
  pickupDate: Date | null;
  employeeId: string;
  notes?: string;
}

// Navigation param list
type RootStackParamList = {
  OrderManagement: undefined;
  OrderDetails: { orderId: string };
  DASHBOARD: undefined;
};

const OrderManagement: React.FC = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  
  // State for orders and UI
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [refreshing, setRefreshing] = useState(false);
  
  // Fetch orders on component mount
  useEffect(() => {
    fetchOrders();
  }, []);
  
  // Filter orders when search query or status filter changes
  useEffect(() => {
    filterOrders();
  }, [searchQuery, statusFilter, orders]);
  
  // Fetch orders from database
  const fetchOrders = async () => {
    try {
      setLoading(true);
      
      // This would typically be a call to your API or local database
      // For now, we'll use mock data
      const mockOrders: Order[] = [
        {
          id: 'order-123456',
          customerId: 'customer-1',
          customerName: 'John Doe',
          items: [
            { id: 'item-1', name: 'Shirt', price: 5.99, quantity: 2 },
            { id: 'item-2', name: 'Pants', price: 8.99, quantity: 1 }
          ],
          total: 20.97,
          status: OrderStatus.PENDING,
          createdAt: new Date(),
          pickupDate: new Date(Date.now() + 86400000 * 2), // 2 days from now
          employeeId: 'employee-1'
        },
        {
          id: 'order-789012',
          customerId: 'customer-2',
          customerName: 'Jane Smith',
          items: [
            { id: 'item-3', name: 'Dress', price: 12.99, quantity: 1 },
            { id: 'item-4', name: 'Jacket', price: 15.99, quantity: 1 }
          ],
          total: 28.98,
          status: OrderStatus.PROCESSING,
          createdAt: new Date(Date.now() - 86400000), // 1 day ago
          pickupDate: new Date(Date.now() + 86400000), // 1 day from now
          employeeId: 'employee-2'
        }
      ];
      
      setOrders(mockOrders);
      setFilteredOrders(mockOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      Alert.alert('Error', 'Failed to fetch orders. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  // Filter orders based on search query and status filter
  const filterOrders = () => {
    let filtered = [...orders];
    
    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(order => 
        order.id.toLowerCase().includes(query) ||
        order.customerName?.toLowerCase().includes(query) ||
        order.customerId.toLowerCase().includes(query)
      );
    }
    
    setFilteredOrders(filtered);
  };
  
  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };
  
  // Handle order selection
  const handleOrderSelect = (orderId: string) => {
    navigation.navigate('OrderDetails', { orderId });
  };
  
  // Handle status update
  const handleStatusUpdate = (orderId: string, newStatus: OrderStatus) => {
    setOrders(prevOrders => 
      prevOrders.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      )
    );
    
    // This would typically be a call to your API or local database to update the order status
    Alert.alert('Status Updated', `Order ${orderId} status updated to ${newStatus}`);
  };
  
  // Handle QR code reprint
  const handleReprintQRCode = async (orderId: string) => {
    try {
      const success = await PrinterService.printQRCode(orderId);
      if (success) {
        Alert.alert('Success', 'QR code printed successfully');
      } else {
        const status = PrinterService.getConnectionStatus();
        Alert.alert('Error', `Failed to print QR code: ${status.error}`);
      }
    } catch (error) {
      console.error('Error printing QR code:', error);
      Alert.alert('Error', 'Failed to print QR code. Please check printer connection.');
    }
  };
  
  // Render order item
  const renderOrderItem = ({ item }: { item: Order }) => {
    const statusColors = {
      [OrderStatus.PENDING]: '#FFC107',
      [OrderStatus.PROCESSING]: '#2196F3',
      [OrderStatus.READY]: '#4CAF50',
      [OrderStatus.COMPLETED]: '#9E9E9E',
      [OrderStatus.CANCELLED]: '#F44336'
    };
    
    return (
      <TouchableOpacity
        style={styles.orderItem}
        onPress={() => handleOrderSelect(item.id)}
      >
        <View style={styles.orderHeader}>
          <Text style={styles.orderId}>{item.id}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColors[item.status] }]}>
            <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
          </View>
        </View>
        
        <View style={styles.orderDetails}>
          <Text style={styles.customerName}>{item.customerName || 'Unknown Customer'}</Text>
          <Text>Items: {item.items.length}</Text>
          <Text>Total: ${item.total.toFixed(2)}</Text>
          <Text>Created: {new Date(item.createdAt).toLocaleDateString()}</Text>
          <Text>Pickup: {item.pickupDate ? new Date(item.pickupDate).toLocaleDateString() : 'Not specified'}</Text>
        </View>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.statusButton]}
            onPress={() => {
              // Show status update options
              Alert.alert(
                'Update Status',
                'Select new status:',
                Object.values(OrderStatus).map(status => ({
                  text: status.charAt(0).toUpperCase() + status.slice(1),
                  onPress: () => handleStatusUpdate(item.id, status as OrderStatus)
                }))
              );
            }}
          >
            <Text style={styles.actionButtonText}>Update Status</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.printButton]}
            onPress={() => handleReprintQRCode(item.id)}
          >
            <Text style={styles.actionButtonText}>Reprint QR</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };
  
  // Render status filter buttons
  const renderStatusFilters = () => {
    const statuses = ['all', ...Object.values(OrderStatus)];
    
    return (
      <View style={styles.statusFilters}>
        {statuses.map(status => (
          <TouchableOpacity
            key={status}
            style={[
              styles.statusFilterButton,
              statusFilter === status && styles.activeStatusFilter
            ]}
            onPress={() => setStatusFilter(status as OrderStatus | 'all')}
          >
            <Text
              style={[
                styles.statusFilterText,
                statusFilter === status && styles.activeStatusFilterText
              ]}
            >
              {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Order Management</Text>
        
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate('DASHBOARD')}
        >
          <Text style={styles.backButtonText}>Back to Dashboard</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by order ID or customer"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      
      {renderStatusFilters()}
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Loading orders...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          renderItem={renderOrderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.ordersList}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No orders found</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#4CAF50',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  backButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 5,
  },
  backButtonText: {
    color: 'white',
  },
  searchContainer: {
    padding: 10,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchInput: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 5,
  },
  statusFilters: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  statusFilterButton: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginRight: 5,
    borderRadius: 15,
    backgroundColor: '#f0f0f0',
  },
  activeStatusFilter: {
    backgroundColor: '#4CAF50',
  },
  statusFilterText: {
    color: '#666',
  },
  activeStatusFilterText: {
    color: 'white',
  },
  ordersList: {
    padding: 10,
  },
  orderItem: {
    backgroundColor: 'white',
    borderRadius: 5,
    padding: 15,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  orderId: {
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  orderDetails: {
    marginBottom: 10,
  },
  customerName: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 5,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    padding: 8,
    borderRadius: 5,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  statusButton: {
    backgroundColor: '#2196F3',
  },
  printButton: {
    backgroundColor: '#FF9800',
  },
  actionButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
  },
});

export default OrderManagement;
