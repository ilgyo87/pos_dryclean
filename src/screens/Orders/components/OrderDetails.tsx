// src/screens/Orders/OrderDetails.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../../store';
import { fetchOrderById, updateOrderStatus, fetchOrderItems } from '../../../store/slices/OrderSlice';
import OrderSummary from '../../Checkout/components/OrderSummary';

// Order status types
type OrderStatus = 'CREATED' | 'PROCESSING' | 'READY' | 'COMPLETED' | 'CANCELLED' | 'DELIVERY_SCHEDULED' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'FAILED';

export default function OrderDetails() {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const dispatch = useDispatch<AppDispatch>();
  
  // Extract order ID from route params
  const { orderId } = route.params || {};
  
  // Redux state
  const {
    currentOrder,
    isLoading: orderLoading,
    error: orderError,
    orderItems,
    orderItemsLoading,
    orderItemsError
  } = useSelector((state: RootState) => state.order);
  
  // Local state
  const [refreshing, setRefreshing] = useState(false);
  
  // Fetch order details and order items when component mounts
  useEffect(() => {
    if (orderId) {
      dispatch(fetchOrderById(orderId));
      dispatch(fetchOrderItems(orderId));
    }
  }, [dispatch, orderId]);
  
  // Format date to readable string
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };
  
  // Get status color
  const getStatusColor = (status?: OrderStatus): string => {
    if (!status) return '#757575'; // Default gray
    
    switch (status) {
      case 'CREATED':
        return '#2196F3'; // Blue
      case 'PROCESSING':
        return '#FFA000'; // Amber
      case 'READY':
        return '#4CAF50'; // Green
      case 'COMPLETED':
        return '#388E3C'; // Dark Green
      case 'CANCELLED':
        return '#F44336'; // Red
      case 'DELIVERY_SCHEDULED':
        return '#9C27B0'; // Purple
      case 'OUT_FOR_DELIVERY':
        return '#FF5722'; // Deep Orange
      case 'DELIVERED':
        return '#009688'; // Teal
      default:
        return '#757575'; // Grey
    }
  };
  
  // Format status text
  const formatStatus = (status?: OrderStatus): string => {
    if (!status) return 'Unknown';
    
    return status.replace(/_/g, ' ').toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  // Handle order refresh
  const handleRefresh = async () => {
    if (orderId) {
      setRefreshing(true);
      await dispatch(fetchOrderById(orderId));
      setRefreshing(false);
    }
  };
  
  // Handle status update
  const handleStatusUpdate = (newStatus: OrderStatus) => {
    if (!currentOrder || !orderId) return;
    
    Alert.alert(
      'Update Order Status',
      `Are you sure you want to change this order status to ${formatStatus(newStatus)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Update', 
          onPress: async () => {
            try {
              await dispatch(updateOrderStatus({ orderId, status: newStatus }));
              // Refresh order details
              dispatch(fetchOrderById(orderId));
            } catch (error) {
              console.error('Error updating order status:', error);
              Alert.alert('Error', 'Failed to update order status');
            }
          },
          style: 'default'
        },
      ]
    );
  };
  
  // Get appropriate next status options based on current status
  const getNextStatusOptions = (currentStatus?: OrderStatus): OrderStatus[] => {
    if (!currentStatus) return [];
    
    switch (currentStatus) {
      case 'CREATED':
        return ['PROCESSING', 'CANCELLED'];
      case 'PROCESSING':
        return ['READY', 'CANCELLED'];
      case 'READY':
        return ['COMPLETED', 'DELIVERY_SCHEDULED', 'CANCELLED'];
      case 'DELIVERY_SCHEDULED':
        return ['OUT_FOR_DELIVERY', 'CANCELLED'];
      case 'OUT_FOR_DELIVERY':
        return ['DELIVERED', 'CANCELLED'];
      case 'COMPLETED':
      case 'DELIVERED':
      case 'CANCELLED':
        return ['FAILED']; // Terminal states, no next status
      default:
        return [];
    }
  };
  
  // Use order items from the Redux orderItem slice
  const displayOrderItems = (orderItems || []).map((item: any) => ({
    id: item.id,
    name: item.name || `Item #${item.id?.substring(0, 6)}`,
    price: item.price || 0,
    quantity: item.quantity ?? 1,
    type: item.type || 'product',
    orderId: item.orderId,
    orderNumber: item.orderNumber,
    starch: item.starch ?? 'NONE',
    pressOnly: item.pressOnly ?? false
  }));
  
  // Calculate financial totals
  const subtotal = currentOrder?.subtotal || 0;
  const tax = currentOrder?.tax || 0;
  const tip = currentOrder?.tip || 0;
  const total = currentOrder?.total || subtotal + tax + tip;
  
  // Next status options for current order
  const nextStatusOptions = getNextStatusOptions(currentOrder?.status || 'FAILED');
  
  if ((orderLoading || orderItemsLoading) && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text style={styles.loadingText}>Loading order details...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  if (orderError || orderItemsError) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#E53935" />
          <Text style={styles.errorText}>{orderError || orderItemsError}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  
  if (!currentOrder) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="document-text-outline" size={64} color="#ccc" />
          <Text style={styles.errorText}>Order not found</Text>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Back to Orders</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Header with back button */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
            <Ionicons name="refresh" size={24} color="#4285F4" />
          </TouchableOpacity>
        </View>
        
        {/* Order Header */}
        <View style={styles.orderHeader}>
          <Text style={styles.orderNumber}>{currentOrder.orderNumber}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(currentOrder.status || 'FAILED') }]}>
            <Text style={styles.statusText}>{formatStatus(currentOrder.status || 'FAILED')}</Text>
          </View>
        </View>
        
        {/* Order Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Information</Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date Placed</Text>
            <Text style={styles.detailValue}>{formatDate(currentOrder.orderDate)}</Text>
          </View>
          
          {currentOrder.dueDate && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Due Date</Text>
              <Text style={styles.detailValue}>{formatDate(currentOrder.dueDate)}</Text>
            </View>
          )}
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Customer</Text>
            <Text style={styles.detailValue}>
              {(currentOrder as any).customerName || 'Customer not found'}
            </Text>
          </View>
          
          {currentOrder.notes && currentOrder.notes.length > 0 && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Notes</Text>
              <Text style={styles.detailValue}>{currentOrder.notes.join('\n')}</Text>
            </View>
          )}
        </View>
        
        {/* Order Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Items</Text>
          {orderItemsLoading ? (
            <ActivityIndicator size="small" color="#4285F4" />
          ) : displayOrderItems.length > 0 ? (
            <OrderSummary
              items={displayOrderItems}
              subtotal={subtotal}
              tax={tax}
              tip={tip}
              total={total}
              showTotals={true}
              dueDate={currentOrder.dueDate ? new Date(currentOrder.dueDate) : undefined}
            />
          ) : (
            <Text style={styles.emptyText}>No items found for this order</Text>
          )}
        </View>
        
        {/* Update Status Section */}
        {nextStatusOptions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Update Status</Text>
            
            <View style={styles.statusButtons}>
              {nextStatusOptions.map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[styles.statusButton, { backgroundColor: getStatusColor(status) }]}
                  onPress={() => handleStatusUpdate(status)}
                >
                  <Text style={styles.statusButtonText}>{formatStatus(status)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    padding: 16,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
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
    marginTop: 16,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 4,
  },
  refreshButton: {
    padding: 8,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  orderNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  detailLabel: {
    width: '40%',
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  detailValue: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 20,
  },
  statusButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statusButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 4,
    marginRight: 10,
    marginBottom: 10,
  },
  statusButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  retryButton: {
    backgroundColor: '#4285F4',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 4,
    marginTop: 16,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
});