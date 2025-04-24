import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, SafeAreaView, TextInput, Modal, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import * as Print from 'expo-print';
import OrderSearchBar from './OrderSearchBar';
import OrderList from './OrderList';
import StatusHeaderBar, { OrderStatus } from './StatusHeaderBar';
import { useOrders } from '../../../hooks/useOrders';
import { Order, Product } from '../../../types';
import OrderItemToggleList from './OrderItemToggleList';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { generateQRCodeData } from '../../../utils/QRCodeGenerator';
import OrderPrintSheet from './OrderPrintSheet';

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
  const [showPreviewModal, setShowPreviewModal] = useState(false);

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

  // Generate HTML for QR codes for Expo Print
  const generateQRCodesHTML = (items: Product[], customerName: string, orderId: string): string => {
    // Start with HTML header optimized for mobile printing
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
        <style>
          @page {
            size: 58mm 40mm; /* Typical thermal receipt printer size */
            margin: 0;
          }
          body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            padding: 5mm;
            margin: 0;
            width: 100%;
            box-sizing: border-box;
          }
          .page-break {
            page-break-after: always;
            height: 0;
          }
          .order-header {
            text-align: center;
            margin-bottom: 3mm;
            font-size: 3.5mm;
            font-weight: bold;
          }
          .item-container {
            border: 0.3mm solid #ccc;
            border-radius: 2mm;
            padding: 3mm;
            margin-bottom: 3mm;
            display: flex;
            flex-direction: row;
            align-items: center;
          }
          .qr-code {
            width: 20mm;
            height: 20mm;
          }
          .item-details {
            margin-left: 3mm;
            flex: 1;
          }
          .customer-name {
            font-weight: bold;
            font-size: 3mm;
            margin-bottom: 1mm;
          }
          .item-name {
            font-size: 3mm;
            color: #007bff;
            font-weight: bold;
          }
          .item-options {
            font-size: 2.5mm;
            color: #666;
            margin-top: 1mm;
          }
          .item-id {
            font-size: 2mm;
            color: #999;
            margin-top: 1mm;
            font-family: monospace;
          }
        </style>
      </head>
      <body>
        <div class="order-header">Order #${orderId.substring(0, 8)}</div>
    `;

    // Generate HTML for each item with proper page breaks for Expo Print
    items.forEach((item, index) => {
      // Generate QR code data using the utility
      const qrData = generateQRCodeData('Product', {
        id: item._id,
        orderItemId: item.orderItemId || item._id,
        orderId: item.orderId || '',
        customerId: item.customerId || '',
        businessId: item.businessId || '',
      });

      // Encode the data for use in a QR code
      const encodedData = encodeURIComponent(qrData);
      
      // Use a QR code generation service - Google Chart API for simplicity
      // Higher resolution (300x300) for better print quality
      const qrCodeUrl = `https://chart.googleapis.com/chart?cht=qr&chs=300x300&chld=M|0&chl=${encodedData}`;

      // Add item container with improved thermal printer formatting
      html += `
        <div class="item-container">
          <img src="${qrCodeUrl}" class="qr-code" />
          <div class="item-details">
            <div class="customer-name">${customerName || 'Customer'}</div>
            <div class="item-name">${item.name || 'Item'}</div>
            ${item.starch ? `<div class="item-options">Starch: ${item.starch}</div>` : ''}
            ${item.pressOnly ? `<div class="item-options">Press Only</div>` : ''}
            <div class="item-id">${item._id.substring(0, 8)}</div>
          </div>
        </div>
        ${index < items.length - 1 ? '<div class="page-break"></div>' : ''}
      `;
    });

    // Close HTML with current date timestamp for tracking
    const now = new Date();
    const timestamp = now.toLocaleString();
    
    html += `
      <div style="text-align: center; font-size: 2mm; color: #999; margin-top: 2mm;">
        ${timestamp}
      </div>
      </body>
      </html>
    `;

    return html;
  };

  // Direct HTML printing with QR codes using Expo Print
  const printQRCodes = async () => {
    if (selectedOrder) {
      try {
        // Filter items based on selected IDs
        const selectedItems = selectedOrder.items.filter(item => 
          selectedPrintItemIds.has(item._id)
        );
        
        if (selectedItems.length === 0) {
          Alert.alert('No Items Selected', 'Please select at least one item to print.');
          return;
        }
        
        // Generate HTML with QR codes
        const html = generateQRCodesHTML(
          selectedItems,
          selectedOrder.customerName || '',
          selectedOrder._id
        );
        
        // Print using Expo Print
        // This works with Expo's printing service which supports iOS/Android/Web
        const { uri } = await Print.printToFileAsync({ html });
        await Print.printAsync({
          uri,
          // You can set additional options here if needed:
          // printerUrl: selectedPrinter?.url, // To target a specific printer
          // orientation: Print.Orientation.portrait,
          // numberOfCopies: 1,
        });
      } catch (error) {
        console.error('Print error:', error);
        Alert.alert('Print Error', 'There was an error printing the QR codes.');
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
                    <View style={styles.buttonRow}>
                      <TouchableOpacity
                        style={[styles.previewButton, selectedPrintItemIds.size === 0 && styles.disabledButton]}
                        onPress={() => setShowPreviewModal(true)}
                        disabled={selectedPrintItemIds.size === 0}
                      >
                        <Text style={styles.buttonText}>Preview QR Labels</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.printButton, selectedPrintItemIds.size === 0 && styles.disabledButton]}
                        onPress={printQRCodes}
                        disabled={selectedPrintItemIds.size === 0}
                      >
                        <Text style={styles.printButtonText}>Print QR Labels</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
                {/* Status Change Section */}
                <View style={styles.statusButtonsContainer}>
                  <Text style={styles.sectionTitle}>Change Status</Text>
                  <View style={styles.statusButtons}>
                    {selectedOrder.status !== 'PROCESSING' && (
                      <TouchableOpacity
                        style={[styles.statusButton, { backgroundColor: '#FFF9C4', borderColor: '#FFC107' }]}
                        onPress={() => handleStatusChange(selectedOrder._id, 'PROCESSING')}
                      >
                        <Text style={[styles.statusButtonText, { color: '#F57F17' }]}>Processing</Text>
                      </TouchableOpacity>
                    )}
                    {selectedOrder.status !== 'READY' && (
                      <TouchableOpacity
                        style={[styles.statusButton, { backgroundColor: '#E8F5E9', borderColor: '#4CAF50' }]}
                        onPress={() => handleStatusChange(selectedOrder._id, 'READY')}
                      >
                        <Text style={[styles.statusButtonText, { color: '#2E7D32' }]}>Ready</Text>
                      </TouchableOpacity>
                    )}
                    {selectedOrder.status !== 'COMPLETED' && (
                      <TouchableOpacity
                        style={[styles.statusButton, { backgroundColor: '#F5F5F5', borderColor: '#9E9E9E' }]}
                        onPress={() => handleStatusChange(selectedOrder._id, 'COMPLETED')}
                      >
                        <Text style={[styles.statusButtonText, { color: '#616161' }]}>Completed</Text>
                      </TouchableOpacity>
                    )}
                    {selectedOrder.status !== 'CANCELLED' && (
                      <TouchableOpacity
                        style={[styles.statusButton, { backgroundColor: '#FFEBEE', borderColor: '#F44336' }]}
                        onPress={() => handleStatusChange(selectedOrder._id, 'CANCELLED')}
                      >
                        <Text style={[styles.statusButtonText, { color: '#C62828' }]}>Cancelled</Text>
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
      
      {/* QR Code Preview Modal */}
      {selectedOrder && (
        <Modal
          visible={showPreviewModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowPreviewModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.previewModalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>QR Code Preview</Text>
                <TouchableOpacity
                  onPress={() => setShowPreviewModal(false)}
                  style={styles.closeButton}
                >
                  <MaterialIcons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalScroll}>
                <OrderPrintSheet 
                  items={selectedOrder.items.filter(item => selectedPrintItemIds.has(item._id))}
                  customerName={selectedOrder.customerName || 'Customer'}
                />
              </ScrollView>
              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.printButton}
                  onPress={() => {
                    setShowPreviewModal(false);
                    printQRCodes();
                  }}
                >
                  <Text style={styles.printButtonText}>Print QR Labels</Text>
                </TouchableOpacity>
              </View>
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
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  previewButton: {
    backgroundColor: '#009688',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  printButton: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  disabledButton: {
    backgroundColor: '#B0C4DE',
    opacity: 0.7,
  },
  printButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
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
  previewModalContent: {
    width: '90%',
    maxWidth: 500,
    backgroundColor: '#fff',
    borderRadius: 12,
    maxHeight: '90%',
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
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
});

export default OrdersScreen;