import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  SafeAreaView, 
  TextInput, 
  Modal, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  Alert 
} from 'react-native';
import OrderSearchBar from './OrderSearchBar';
import OrderList from './OrderList';
import { OrderStatus } from './StatusHeaderBar';
import { useOrders } from '../../../hooks/useOrders';
import { Order } from '../../../types';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import OrderPrintSelection from './OrderPrintSelection';
import printerService from '../../../utils/PrinterService';
import BarcodeTicketingScreen from './BarcodeTicketingScreen';
import { updateOrderAfterTicketing } from '../../../utils/OrderBarcodeUtils';
import type { Product } from '../../../types';
import { styles } from './OrderScreenStyles';

interface OrdersScreenProps {
  employeeId?: string;
  firstName?: string;
  lastName?: string;
}

const OrdersScreen: React.FC<OrdersScreenProps> = ({ employeeId, firstName, lastName }) => {
  // Order detail modal state
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetailModal, setShowOrderDetailModal] = useState(false);
  const [selectedPrintItemIds, setSelectedPrintItemIds] = useState<Set<string>>(new Set());
  const [isPrinting, setIsPrinting] = useState(false);
  // Barcode Ticketing state
  const [showBarcodeTicketing, setShowBarcodeTicketing] = useState(false);
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>('ALL');
  
  // Hooks and refs
  const { orders, isLoading, error, statusCounts, refetch, updateStatus } = useOrders();
  const searchInputRef = useRef<TextInput>(null);
  const isPrintingRef = useRef(false);

  // When an order is selected, select all items for print by default
  useEffect(() => {
    if (selectedOrder && selectedOrder.status === 'CREATED') {
      setSelectedPrintItemIds(new Set(selectedOrder.items.map(item => item._id)));
    }
  }, [selectedOrder]);

  // Handle starting barcode ticketing
  const handleStartBarcodeTicketing = () => {
    if (!selectedOrder) {
      Alert.alert('No Order Selected', 'Please select an order first.');
      return;
    }
    if (selectedOrder.status !== 'CREATED') {
      Alert.alert(
        'Invalid Status',
        'Only orders with "CREATED" status can be processed for barcode ticketing.',
        [{ text: 'OK' }]
      );
      return;
    }
    setShowBarcodeTicketing(true);
    setShowOrderDetailModal(false);
  };

  // Handle completion of barcode ticketing
  const handleBarcodeTicketingComplete = async (updatedItems: Product[]) => {
    if (!selectedOrder) return;
    try {
      const success = await updateOrderAfterTicketing(
        selectedOrder._id,
        updatedItems,
        'PROCESSING',
        firstName && lastName ? `${firstName} ${lastName}` : undefined
      );
      if (success) {
        Alert.alert(
          'Success',
          'Order has been processed and status updated to PROCESSING.',
          [{ text: 'OK' }]
        );
        refetch();
      } else {
        Alert.alert(
          'Error',
          'Failed to update order status. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error updating order after ticketing:', error);
      Alert.alert(
        'Error',
        'An unexpected error occurred while updating the order.',
        [{ text: 'OK' }]
      );
    } finally {
      setShowBarcodeTicketing(false);
    }
  };

  // Handle order status change
  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    const employeeName = firstName && lastName 
      ? `${firstName} ${lastName}` 
      : `Employee ${employeeId}`;
    
    await updateStatus(orderId, newStatus, employeeName);
    setShowOrderDetailModal(false);
  };

  // Toggle item selection for printing
  const handleTogglePrintItem = (itemId: string) => {
    setSelectedPrintItemIds(prev => {
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
  const handlePrintComplete = async (success: boolean) => {
    if (success && selectedOrder && selectedOrder.status === 'CREATED') {
      const shouldUpdateStatus = await new Promise<boolean>((resolve) => {
        Alert.alert(
          'Update Order Status?',
          'Would you like to mark this order as "Processing" now?',
          [
            { text: 'No', onPress: () => resolve(false) },
            { text: 'Yes', onPress: () => resolve(true) }
          ]
        );
      });
      
      if (shouldUpdateStatus) {
        const employeeName = firstName && lastName
          ? `${firstName} ${lastName}`
          : `Employee ${employeeId}`;
        
        await updateStatus(selectedOrder._id, 'PROCESSING', employeeName);
        setShowOrderDetailModal(false);
      }
    }
  };

  // Filter orders based on search query
  useEffect(() => {
    if (!orders) return;
    
    if (!searchQuery.trim()) {
      setFilteredOrders(orders);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const filtered = orders.filter(order => {
      // Search by order ID
      if (order._id.toLowerCase().includes(query)) return true;
      
      // Search by customer name
      if (order.customerName && order.customerName.toLowerCase().includes(query)) return true;
      
      // Search in notes
      if (order.notes && order.notes.some(note => note.toLowerCase().includes(query))) return true;
      
      // Search by item name
      if (order.items && order.items.some(item => item.name.toLowerCase().includes(query))) return true;
      
      return false;
    });
    
    setFilteredOrders(filtered);
  }, [searchQuery, orders]);

  // Focus search input when component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  // Handle order selection
  const handleOrderSelect = (order: Order) => {
    setSelectedOrder(order);
    setShowOrderDetailModal(true);
  };

  // Initialize printer service
  useEffect(() => {
    printerService.initialize().catch(error => {
      console.error('Error initializing printer service:', error);
    });
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <OrderSearchBar 
        value={searchQuery}
        onChangeText={setSearchQuery}
        onClear={() => setSearchQuery('')}
        inputRef={searchInputRef}
        placeholder="Search by order #, customer name, or item..."
      />
      
      <OrderList 
        orders={filteredOrders}
        isLoading={isLoading}
        error={error}
        selectedStatus={selectedStatus}
        onRefresh={refetch}
        onOrderSelect={handleOrderSelect}
      />
      
      {/* Order Detail Modal */}
      {selectedOrder && (
        <Modal
          visible={showOrderDetailModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowOrderDetailModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  Order #{selectedOrder._id.substring(0, 8)}
                </Text>
                <TouchableOpacity
                  onPress={() => setShowOrderDetailModal(false)}
                  style={styles.closeButton}
                >
                  <MaterialIcons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.modalScroll}>
                {/* Order Details */}
                <View style={styles.orderDetailRow}>
                  <Text style={styles.orderDetailLabel}>Customer:</Text>
                  <Text style={styles.orderDetailValue}>
                    {selectedOrder.customerName || selectedOrder.customerId}
                  </Text>
                </View>
                
                <View style={styles.orderDetailRow}>
                  <Text style={styles.orderDetailLabel}>Status:</Text>
                  <Text style={[
                    styles.orderDetailValue,
                    styles.statusText,
                    getStatusColor(selectedOrder.status as OrderStatus)
                  ]}>
                    {selectedOrder.status}
                  </Text>
                </View>
                
                <View style={styles.orderDetailRow}>
                  <Text style={styles.orderDetailLabel}>Total:</Text>
                  <Text style={styles.orderDetailValue}>
                    ${selectedOrder.total.toFixed(2)}
                  </Text>
                </View>
                
                <View style={styles.orderDetailRow}>
                  <Text style={styles.orderDetailLabel}>Created:</Text>
                  <Text style={styles.orderDetailValue}>
                    {new Date(selectedOrder.createdAt).toLocaleString()}
                  </Text>
                </View>
                
                {selectedOrder.pickupDate && (
                  <View style={styles.orderDetailRow}>
                    <Text style={styles.orderDetailLabel}>Pickup:</Text>
                    <Text style={styles.orderDetailValue}>
                      {new Date(selectedOrder.pickupDate).toLocaleString()}
                    </Text>
                  </View>
                )}
                
                {/* Print QR Codes Section */}
                {selectedOrder.status === 'CREATED' && (
  <OrderPrintSelection
    items={selectedOrder.items.map(item => ({
      ...item,
      starch: ['none', 'light', 'medium', 'heavy'].includes(item.starch as string)
        ? (item.starch as 'none' | 'light' | 'medium' | 'heavy' | undefined)
        : undefined,
    }))}
    selectedItemIds={selectedPrintItemIds}
    onToggleItem={handleTogglePrintItem}
    customerName={selectedOrder.customerName || 'Customer'}
    orderId={selectedOrder._id}
    onPrintComplete={handlePrintComplete}
  />
)}
                
                
                {/* Notes Section */}
                {selectedOrder.notes && selectedOrder.notes.length > 0 && (
                  <View style={styles.notesSection}>
                    <Text style={styles.sectionTitle}>Notes</Text>
                    {selectedOrder.notes.map((note, index) => (
                      <View key={index} style={styles.noteItem}>
                        <MaterialIcons name="note" size={16} color="#666" style={styles.noteIcon} />
                        <Text style={styles.noteText}>{note}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    {/* Barcode Ticketing Modal */}
    {selectedOrder && showBarcodeTicketing && (
  <BarcodeTicketingScreen
    orderId={selectedOrder._id}
    items={selectedOrder.items.map(item => ({
      ...item,
      starch: ['none', 'light', 'medium', 'heavy'].includes(item.starch as string)
        ? (item.starch as 'none' | 'light' | 'medium' | 'heavy' | undefined)
        : undefined,
    }))}
    customerName={selectedOrder.customerName || 'Customer'}
    customerId={selectedOrder.customerId}
    onComplete={handleBarcodeTicketingComplete}
    onCancel={() => setShowBarcodeTicketing(false)}
  />
)}
    </SafeAreaView>
  );
};

// Helper function to get color based on status
const getStatusColor = (status: OrderStatus) => {
  switch (status) {
    case 'CREATED':
      return { color: '#2196F3' }; // Blue
    case 'PROCESSING':
      return { color: '#FFC107' }; // Yellow
    case 'READY':
      return { color: '#4CAF50' }; // Green
    case 'COMPLETED':
      return { color: '#9E9E9E' }; // Grey
    case 'CANCELLED':
      return { color: '#F44336' }; // Red
    default:
      return { color: '#333' }; // Default black
  }
};

export default OrdersScreen;