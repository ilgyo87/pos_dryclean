// src/screens/Orders/Orders.tsx
import React, { useState, useCallback, useEffect } from "react";
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
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../store";
import { fetchOrders, updateOrderStatus, fetchOrderItemsCount } from "../../store/slices/OrderSlice";
import OrderCard from "./components/OrderCard";
import FilterTabs from "./components/FilterTabs";
import SearchBar from "../../components/SearchBar";

type OrderStatus = 'ALL' | 'CREATED' | 'PROCESSING' | 'READY' | 'COMPLETED' | 'CANCELLED' | 'DELIVERY_SCHEDULED' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'FAILED';

export default function Orders({ user, employee, navigation }: { 
  user: AuthUser | null, 
  employee: { id: string, name: string } | null,
  navigation?: any 
}) {
  const dispatch = useDispatch<AppDispatch>();
  const navigator = useNavigation<any>();
  
  // Redux state
  const { orders, isLoading, error } = useSelector((state: RootState) => state.order);
  const { businesses } = useSelector((state: RootState) => state.business);
  
  // Local state
  const [activeTab, setActiveTab] = useState<OrderStatus>('ALL');
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [orderItemCounts, setOrderItemCounts] = useState<Record<string, number>>({});

  // Get the default business ID
  const defaultBusinessId = businesses.length > 0 ? businesses[0].id : "";

  // Fetch orders when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (user?.userId && defaultBusinessId) {
        dispatch(fetchOrders(defaultBusinessId));
      }
    }, [user?.userId, dispatch, defaultBusinessId])
  );

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    if (user?.userId && defaultBusinessId) {
      setRefreshing(true);
      await dispatch(fetchOrders(defaultBusinessId));
      setRefreshing(false);
    }
  }, [user?.userId, dispatch, defaultBusinessId]);

  // Filter orders based on selected tab and search query
  const filteredOrders = orders.filter(order => {
    // First filter by status tab
    if (activeTab !== 'ALL' && order.status !== activeTab) {
      return false;
    }

    // Then filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      
      // Check order number
      if (order.orderNumber.toLowerCase().includes(query)) {
        return true;
      }
      
      // Check customer name if exists
      const customerName = (order as any).customerName || ""; // Using any since customerName might be added via mapping
      if (customerName.toLowerCase().includes(query)) {
        return true;
      }
      
      return false;
    }
    
    return true;
  });

  // Handle status change
  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      if (newStatus === 'ALL') return; // ALL is not a valid status for an order
      
      await dispatch(updateOrderStatus({ 
        orderId, 
        status: newStatus,
        employeeId: employee?.id
      }));
      
      // Re-fetch orders to update the list
      if (defaultBusinessId) {
        dispatch(fetchOrders(defaultBusinessId));
      }
    } catch (error) {
      console.error("Error updating order status:", error);
    }
  };

  // Navigate to order details
  const handleOrderPress = (orderId: string) => {
    // Navigate to order details screen when implemented
    navigator.navigate('OrderDetails', { orderId });
  };

  // Get total items count for an order
  const getOrderItemsCount = (order: any) => {
    // If we already have the count in state, use it
    if (orderItemCounts[order.id]) {
      return orderItemCounts[order.id];
    }
    
    // Otherwise, fetch the count
    dispatch(fetchOrderItemsCount(order.id))
      .unwrap()
      .then((count) => {
        setOrderItemCounts(prev => ({
          ...prev,
          [order.id]: count
        }));
      })
      .catch(error => {
        console.error('Error fetching order items count:', error);
      });
    
    // Return 0 or the existing count while loading
    return orderItemCounts[order.id] || 0;
  };

  // Prefetch order item counts when orders are loaded
  useEffect(() => {
    if (orders && orders.length > 0) {
      // Fetch counts for all orders
      orders.forEach(order => {
        if (!orderItemCounts[order.id]) {
          dispatch(fetchOrderItemsCount(order.id))
            .unwrap()
            .then((count) => {
              setOrderItemCounts(prev => ({
                ...prev,
                [order.id]: count
              }));
            })
            .catch(error => {
              console.error('Error fetching order items count:', error);
            });
        }
      });
    }
  }, [orders, dispatch]);

  // Render order card
  const renderOrderCard = ({ item }: { item: any }) => {
    return (
      <OrderCard
        order={item}
        itemsCount={orderItemCounts[item.id] || 0}
        onPress={() => handleOrderPress(item.id)}
        onStatusChange={(newStatus) => handleStatusChange(item.id, newStatus as 'CREATED' | 'PROCESSING' | 'READY' | 'COMPLETED' | 'CANCELLED' | 'DELIVERY_SCHEDULED' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'FAILED')}
      />
    );
  };

  // Define status tabs
  const statusTabs: { id: OrderStatus; label: string; icon: string }[] = [
    { id: 'ALL', label: 'All Orders', icon: 'list' },
    { id: 'CREATED', label: 'New', icon: 'create' },
    { id: 'PROCESSING', label: 'Processing', icon: 'refresh' },
    { id: 'READY', label: 'Ready', icon: 'checkmark-circle' },
    { id: 'COMPLETED', label: 'Completed', icon: 'checkbox' },
    { id: 'CANCELLED', label: 'Cancelled', icon: 'close-circle' },
    { id: 'DELIVERY_SCHEDULED', label: 'Delivery Scheduled', icon: 'calendar' },
    { id: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', icon: 'car' },
    { id: 'DELIVERED', label: 'Delivered', icon: 'home' },
  ];

  return (
    <SafeAreaView style={styles.container}>
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
        ) : filteredOrders.length === 0 ? (
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
        ) : (
          <FlatList
            data={filteredOrders}
            renderItem={renderOrderCard}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            refreshing={refreshing}
            onRefresh={handleRefresh}
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