// src/screens/Orders/Order.tsx
import React, { useState, useCallback, useEffect, useRef } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator,
  SafeAreaView
} from "react-native";
import { AuthUser } from "aws-amplify/auth";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../store";
import { clearOrderError } from "../../store/slices/OrderSlice";
import OrderCard from "./components/OrderCard";
import OrderCreatedModal from "./components/OrderCreatedModal";
import FilterTabs from "./components/FilterTabs";
import SearchBar from "../../components/SearchBar";
import { generateClient } from "aws-amplify/api";
import type { Schema } from "../../../amplify/data/resource";

type OrderStatus = 'ALL' | 'CREATED' | 'PROCESSING' | 'READY' | 'COMPLETED' | 'CANCELLED' | 'DELIVERY_SCHEDULED' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'FAILED';

export default function Orders({ user, employee, navigation }: { 
  user: AuthUser | null, 
  employee: { id: string, name: string } | null,
  navigation?: any 
}) {
  const dispatch = useDispatch<AppDispatch>();
  const navigator = useNavigation<any>();
  const client = generateClient<Schema>();
  
  // Create a stable client reference to avoid re-subscriptions
  const clientRef = useRef(client);
  const subscriptionRef = useRef<any>(null);
  
  // Redux state
  const { error: orderError } = useSelector((state: RootState) => state.order);
  
  // Local state
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(orderError);
  const [activeTab, setActiveTab] = useState<OrderStatus>('ALL');
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [orderItemCounts, setOrderItemCounts] = useState<Record<string, number>>({});

  // Modal state for CREATED order
  const [createdModalVisible, setCreatedModalVisible] = useState(false);
  const [modalOrder, setModalOrder] = useState<any | null>(null);
  const [modalOrderItems, setModalOrderItems] = useState<any[]>([]);

  // Helper function to make objects serializable by removing function properties
  const makeSerializable = useCallback((item: any) => {
    if (!item) return item;
    
    // Create a new object with just the data properties
    const serialized: any = {};
    
    // Copy all non-function properties
    Object.keys(item).forEach(key => {
      if (typeof item[key] !== 'function') {
        serialized[key] = item[key];
      }
    });
    
    return serialized;
  }, []);

  // Set up subscription to orders - only once on component mount
  useEffect(() => {
    setIsLoading(true);
    dispatch(clearOrderError());
    setError(null);
    
    console.log('Setting up order subscription - INITIAL');
    
    // Define subscription function
    const setupSubscription = () => {
      // Only set up if not already subscribed
      if (subscriptionRef.current) {
        return;
      }
      
      const subscription = clientRef.current.models.Order.observeQuery().subscribe({
        next: ({ items, isSynced }) => {
          console.log(`Received ${items.length} orders, synced: ${isSynced}`);
          
          // Process and store the orders - make sure they're serializable
          const processedItems = items.map(item => makeSerializable(item));
          
          setOrders(processedItems);
          
          // Only set loading to false after we're synced
          if (isSynced) {
            setIsLoading(false);
          }
        },
        error: (err) => {
          console.error('Error in order subscription:', err);
          setError(err.message || 'Failed to subscribe to orders');
          setIsLoading(false);
        }
      });
      
      // Store the subscription reference
      subscriptionRef.current = subscription;
    };
    
    // Set up the subscription
    setupSubscription();
    
    // Clean up subscription only on unmount
    return () => {
      console.log('Cleaning up order subscription - FINAL');
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
    };
  }, []); // Empty dependency array = only on mount/unmount

  // Handle refresh - gets fresh data without re-subscribing
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    // Get fresh data from API
    try {
      const { data, errors } = await clientRef.current.models.Order.list();
      if (errors) {
        setError(errors[0]?.message || 'Failed to refresh orders');
      } else {
        // Process and store the orders - make sure they're serializable
        const processedItems = data.map(item => makeSerializable(item));
        setOrders(processedItems);
      }
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Unknown error refreshing orders');
      }
    } finally {
      setRefreshing(false);
    }
  }, [makeSerializable]);

  // Filter orders based on selected tab and search query
  const filteredOrders = React.useMemo(() => {
    return orders.filter(order => {
      // First filter by status tab
      if (activeTab !== 'ALL' && order.status !== activeTab) {
        return false;
      }
  
      // Then filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        
        // Check order number
        if (order.orderNumber?.toLowerCase().includes(query)) {
          return true;
        }
        
        // Get customer name directly from order if available
        let customerName = '';
        if (order.firstName && order.lastName) {
          customerName = `${order.firstName} ${order.lastName}`;
        } else if (order.customerName) {
          customerName = order.customerName;
        }
        
        if (customerName.toLowerCase().includes(query)) {
          return true;
        }
        
        return false;
      }
      
      return true;
    });
  }, [orders, activeTab, searchQuery]);

  // Handle status change
  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      if (newStatus === 'ALL') return; // ALL is not a valid status for an order
      
      console.log(`Updating order ${orderId} status to ${newStatus}`);
      
      // Create update input with required fields
      const updateInput: any = {
        id: orderId,
        status: newStatus,
      };
      
      // Add employeeId if available
      if (employee?.id) {
        updateInput.employeeId = employee.id;
      }
      
      // Update using direct client call to ensure immediate update
      const { data, errors } = await clientRef.current.models.Order.update(updateInput);
      
      if (errors) {
        console.error('Errors updating order status:', errors);
        setError(errors[0]?.message || 'Failed to update order status');
      } else {
        console.log('Order status updated successfully');
        // The subscription will handle updating the UI
      }
    } catch (error) {
      console.error("Error updating order status:", error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Unknown error updating order status');
      }
    }
  };

  // Handle order press: show modal if CREATED, else navigate
  const handleOrderPress = useCallback((orderId: string) => {
    if (!orderId) {
      console.error('Invalid order ID');
      return;
    }
    
    const order = orders.find((o: any) => o.id === orderId);
    if (!order) {
      console.error('Order not found:', orderId);
      return;
    }
    
    if (order.status === 'CREATED') {
      // Set modal data for CREATED orders
      setModalOrder(order);
      // Fetch order items
      fetchOrderItemsForModal(orderId);
      setCreatedModalVisible(true);
    } else {
      // Navigate to details for other orders
      navigator.navigate('OrderDetails', { orderId });
    }
  }, [orders, navigator]);

  // Fetch order items for the modal
  const fetchOrderItemsForModal = useCallback(async (orderId: string) => {
    try {
      const { data, errors } = await clientRef.current.models.OrderItem.list({
        filter: { orderId: { eq: orderId } }
      });
      
      if (errors) {
        console.error('Errors fetching order items:', errors);
        return;
      }
      
      // Process items for display - make sure they're serializable
      const processedItems = data.map(item => makeSerializable(item));
      setModalOrderItems(processedItems || []);
    } catch (error) {
      console.error('Error fetching order items for modal:', error);
    }
  }, [makeSerializable]);

  // Get total items count for an order
  const getOrderItemsCount = useCallback(async (orderId: string) => {
    // If we already have the count in state, use it
    if (orderItemCounts[orderId]) {
      return orderItemCounts[orderId];
    }
    
    try {
      // Fetch order items count directly
      const { data, errors } = await clientRef.current.models.OrderItem.list({
        filter: { orderId: { eq: orderId } }
      });
      
      if (errors) {
        console.error('Errors fetching order items count:', errors);
        return 0;
      }
      
      const count = data?.length || 0;
      
      // Update counts state
      setOrderItemCounts(prev => ({
        ...prev,
        [orderId]: count
      }));
      
      return count;
    } catch (error) {
      console.error('Error fetching order items count:', error);
      return 0;
    }
  }, [orderItemCounts]);

  // Prefetch order item counts when orders are loaded
  useEffect(() => {
    if (orders && orders.length > 0 && !isLoading) {
      // Fetch counts for all orders
      orders.forEach(order => {
        if (order.id && !orderItemCounts[order.id]) {
          getOrderItemsCount(order.id);
        }
      });
    }
  }, [orders, getOrderItemsCount, isLoading, orderItemCounts]);

  // Render order card
  const renderOrderCard = useCallback(({ item }: { item: any }) => {
    if (!item || !item.id) {
      return null;
    }
    
    return (
      <OrderCard
        order={item}
        itemsCount={orderItemCounts[item.id] || 0}
        onPress={() => handleOrderPress(item.id)}
        onStatusChange={(newStatus) => handleStatusChange(item.id, newStatus as OrderStatus)}
      />
    );
  }, [handleOrderPress, orderItemCounts, handleStatusChange]);

  // Define status tabs
  const statusTabs = [
    { id: 'ALL' as OrderStatus, label: 'All Orders', icon: 'list' },
    { id: 'CREATED' as OrderStatus, label: 'New', icon: 'create' },
    { id: 'PROCESSING' as OrderStatus, label: 'Processing', icon: 'refresh' },
    { id: 'READY' as OrderStatus, label: 'Ready', icon: 'checkmark-circle' },
    { id: 'COMPLETED' as OrderStatus, label: 'Completed', icon: 'checkbox' },
    { id: 'CANCELLED' as OrderStatus, label: 'Cancelled', icon: 'close-circle' },
    { id: 'DELIVERY_SCHEDULED' as OrderStatus, label: 'Delivery Scheduled', icon: 'calendar' },
    { id: 'OUT_FOR_DELIVERY' as OrderStatus, label: 'Out for Delivery', icon: 'car' },
    { id: 'DELIVERED' as OrderStatus, label: 'Delivered', icon: 'home' },
  ];

  // Remove item from modal order items
  const handleRemoveModalItem = useCallback((itemId: string) => {
    setModalOrderItems(prev => prev.filter(item => item.id !== itemId));
  }, []);

  // Print all handler (stub)
  const handlePrintAll = useCallback(() => {
    // Implement print logic here
    alert('Print All clicked!');
  }, []);

  // Close modal
  const handleCloseModal = useCallback(() => {
    setCreatedModalVisible(false);
    setModalOrder(null);
    setModalOrderItems([]);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* Modal for CREATED orders */}
      <OrderCreatedModal
        visible={createdModalVisible}
        orderNumber={modalOrder?.orderNumber || ''}
        items={modalOrderItems}
        onClose={handleCloseModal}
        onRemoveItem={handleRemoveModalItem}
        onPrintAll={handlePrintAll}
      />
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Orders</Text>
        </View>

        <View style={styles.searchContainer}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search orders by number or customer name..."
          />
        </View>

        <FilterTabs
          tabs={statusTabs}
          activeTab={activeTab}
          onTabPress={setActiveTab}
        />

        {isLoading && !refreshing ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color="#0000ff" />
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : orders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>
              {searchQuery
                ? "No orders found matching your search"
                : activeTab === 'ALL'
                ? "No orders found"
                : `No ${activeTab.toLowerCase()} orders found`}
            </Text>
            <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
              <Text style={styles.refreshButtonText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        ) : filteredOrders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="filter-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>
              No orders match your current filter
            </Text>
            <TouchableOpacity 
              style={styles.refreshButton} 
              onPress={() => {
                setActiveTab('ALL');
                setSearchQuery('');
              }}
            >
              <Text style={styles.refreshButtonText}>Clear Filters</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={filteredOrders}
            renderItem={renderOrderCard}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No orders available</Text>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 16,
    width: '100%',
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  searchContainer: {
    marginVertical: 16,
    width: '100%',
    zIndex: 100,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  refreshButton: {
    backgroundColor: '#4285F4',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 4,
  },
  refreshButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#E53935',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#E53935',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 4,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
});