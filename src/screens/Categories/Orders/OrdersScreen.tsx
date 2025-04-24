import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, SafeAreaView, TextInput, Modal, Text, TouchableOpacity, ScrollView } from 'react-native';
import * as RNPrint from 'react-native-print';
import { captureRef } from 'react-native-view-shot';
import OrderSearchBar from './OrderSearchBar';
import OrderList from './OrderList';
import StatusHeaderBar, { OrderStatus } from './StatusHeaderBar';
import { useOrders } from '../../../hooks/useOrders';
import { Order } from '../../../types';
import OrderItemToggleList from './OrderItemToggleList';
import OrderPrintSheet from './OrderPrintSheet';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

interface OrdersScreenProps {
  employeeId?: string;
  firstName?: string;
  lastName?: string;
}

const OrdersScreen: React.FC<OrdersScreenProps> = ({ employeeId, firstName, lastName }) => {
  // Order detail modal state (move these to the top)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetailModal, setShowOrderDetailModal] = useState(false);

  // ...existing state
  const [selectedPrintItemIds, setSelectedPrintItemIds] = useState<Set<string>>(new Set());
  const [showPrintSheet, setShowPrintSheet] = useState(false);
  const printSheetRef = useRef<View>(null);

  // When an order is selected, select all items for print by default
  useEffect(() => {
    if (selectedOrder && selectedOrder.status === 'CREATED') {
      setSelectedPrintItemIds(new Set(selectedOrder.items.map(item => item._id)));
    }
  }, [selectedOrder]);

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

  // Print handler
  const handlePrint = () => {
    setShowPrintSheet(true);
  };

  // Capture and print the sheet
  const printSheet = async () => {
    if (printSheetRef.current) {
      try {
        const uri = await captureRef(printSheetRef.current, { format: 'png', quality: 1 });
        await RNPrint.print({ filePath: uri });
      } catch (error) {
        console.error('Print error:', error);
      }
    }
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>('ALL');
  const { orders, isLoading, error, statusCounts, refetch, updateStatus } = useOrders();
  const searchInputRef = useRef<TextInput>(null);

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
                {/* Toggleable Items List for CREATED status */}
                {selectedOrder.status === 'CREATED' && (
                  <>
                    <Text style={styles.sectionTitle}>Select Items to Print</Text>
                    <OrderItemToggleList
                      items={selectedOrder.items}
                      selectedIds={selectedPrintItemIds}
                      onToggle={handleTogglePrintItem}
                    />
                    <TouchableOpacity
                      style={styles.printButton}
                      onPress={handlePrint}
                      disabled={selectedPrintItemIds.size === 0}
                    >
                      <Text style={styles.printButtonText}>Print</Text>
                    </TouchableOpacity>
                  </>
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
          {/* Print Sheet Modal */}
          <Modal
            visible={showPrintSheet}
            animationType="fade"
            transparent={true}
            onRequestClose={() => setShowPrintSheet(false)}
          >
            <View style={styles.printSheetOverlay}>
              <View style={styles.printSheetContent}>
                <View ref={printSheetRef} collapsable={false}>
                  <OrderPrintSheet
                    items={selectedOrder.items.filter(item => selectedPrintItemIds.has(item._id))}
                    customerName={selectedOrder.customerName || ''}
                  />
                </View>
                <TouchableOpacity
                  style={styles.printButton}
                  onPress={printSheet}
                  disabled={selectedPrintItemIds.size === 0}
                >
                  <Text style={styles.printButtonText}>Print</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.printSheetCloseButton}
                  onPress={() => setShowPrintSheet(false)}
                >
                  <Text style={styles.printButtonText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
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
  printButton: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  printButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  printSheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  printSheetContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '90%',
    maxWidth: 420,
    alignItems: 'center',
  },
  printSheetCloseButton: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 32,
    alignItems: 'center',
    marginTop: 16,
  },
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