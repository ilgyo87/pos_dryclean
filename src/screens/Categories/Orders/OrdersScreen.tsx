import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, SafeAreaView, TextInput, Modal, Text, TouchableOpacity, ScrollView } from 'react-native';
import OrderSearchBar from './OrderSearchBar';
import OrderList from './OrderList';
import StatusHeaderBar, { OrderStatus } from './StatusHeaderBar';
import { useOrders } from '../../../hooks/useOrders';
import { Order } from '../../../types';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

interface OrdersScreenProps {
  employeeId?: string;
  firstName?: string;
  lastName?: string;
}

const OrdersScreen: React.FC<OrdersScreenProps> = ({ employeeId, firstName, lastName }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>('ALL');
  const { orders, isLoading, error, statusCounts, refetch, updateStatus } = useOrders();
  const searchInputRef = useRef<TextInput>(null);
  
  // Order detail modal state
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetailModal, setShowOrderDetailModal] = useState(false);

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

  // Handle order status change
  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    const employeeName = firstName && lastName ? `${firstName} ${lastName}` : `Employee ${employeeId}`;
    await updateStatus(orderId, newStatus, employeeName);
    setShowOrderDetailModal(false);
  };

  // Handle order selection
  const handleOrderSelect = (order: Order) => {
    setSelectedOrder(order);
    setShowOrderDetailModal(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <OrderSearchBar 
        value={searchQuery}
        onChangeText={setSearchQuery}
        onClear={() => setSearchQuery('')}
        inputRef={searchInputRef}
        placeholder="Search by order #, customer name, or item..."
      />
      
      <StatusHeaderBar 
        selectedStatus={selectedStatus}
        onSelectStatus={setSelectedStatus}
        counts={statusCounts}
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
                  <Text style={styles.orderDetailLabel}>Items:</Text>
                  <Text style={styles.orderDetailValue}>
                    {selectedOrder.items.length} items
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
                
                {/* Item List */}
                <View style={styles.itemsSection}>
                  <Text style={styles.sectionTitle}>Items</Text>
                  {selectedOrder.items.map((item, index) => (
                    <View key={index} style={styles.itemRow}>
                      <Text style={styles.itemName}>{item.name}</Text>
                      <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
                    </View>
                  ))}
                </View>
                
                {/* Status Change Buttons */}
                <View style={styles.statusButtonsContainer}>
                  <Text style={styles.sectionTitle}>Change Status</Text>
                  <View style={styles.statusButtons}>
                    {selectedOrder.status !== 'PROCESSING' && (
                      <TouchableOpacity
                        style={[styles.statusButton, { backgroundColor: '#fff9c4' }]}
                        onPress={() => handleStatusChange(selectedOrder._id, 'PROCESSING')}
                      >
                        <Text style={styles.statusButtonText}>Processing</Text>
                      </TouchableOpacity>
                    )}
                    
                    {selectedOrder.status !== 'READY' && (
                      <TouchableOpacity
                        style={[styles.statusButton, { backgroundColor: '#e8f5e9' }]}
                        onPress={() => handleStatusChange(selectedOrder._id, 'READY')}
                      >
                        <Text style={styles.statusButtonText}>Ready</Text>
                      </TouchableOpacity>
                    )}
                    
                    {selectedOrder.status !== 'COMPLETED' && (
                      <TouchableOpacity
                        style={[styles.statusButton, { backgroundColor: '#f5f5f5' }]}
                        onPress={() => handleStatusChange(selectedOrder._id, 'COMPLETED')}
                      >
                        <Text style={styles.statusButtonText}>Complete</Text>
                      </TouchableOpacity>
                    )}
                    
                    {selectedOrder.status !== 'CANCELLED' && (
                      <TouchableOpacity
                        style={[styles.statusButton, { backgroundColor: '#ffebee' }]}
                        onPress={() => handleStatusChange(selectedOrder._id, 'CANCELLED')}
                      >
                        <Text style={styles.statusButtonText}>Cancel</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
                
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f9fa',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 12,
    maxHeight: '80%',
  },
  modalScroll: {
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  orderDetailRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  orderDetailLabel: {
    width: 80,
    fontWeight: '600',
    color: '#555',
  },
  orderDetailValue: {
    flex: 1,
    color: '#333',
  },
  statusText: {
    fontWeight: '600',
  },
  itemsSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemName: {
    flex: 1,
    fontSize: 14,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007bff',
  },
  statusButtonsContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  statusButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statusButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'transparent',
    minWidth: '48%',
    alignItems: 'center',
  },
  statusButtonText: {
    fontWeight: '500',
  },
  notesSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  noteItem: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  noteIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  noteText: {
    flex: 1,
    fontSize: 14,
    color: '#555',
  },
});

export default OrdersScreen;