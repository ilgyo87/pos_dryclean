// src/screens/Checkout/Checkout.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useDispatch, useSelector } from 'react-redux';
import { createOrder } from '../../store/slices/OrderSlice';
import { fetchCategories } from '../../store/slices/CategorySlice';
import { fetchItems } from '../../store/slices/ItemSlice';
import { RootState, AppDispatch } from '../../store';

import OrderSummary from './components/OrderSummary';
import type { RouteProp } from '@react-navigation/native';
import { AuthUser } from "aws-amplify/auth";
import CheckoutServiceList from './components/CheckoutServiceList';
import CheckoutProductList from './components/CheckoutProductList';
import DueDatePicker from './components/DueDatePicker';
import { Schema } from '../../../amplify/data/resource';
import { Ionicons } from '@expo/vector-icons';

// Define types for our route parameters

// Define the CartItem interface for items in the order
interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  type: 'service' | 'product';
  serviceId?: string;
}

const Checkout = ({ user }: { user: AuthUser | null }) => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const dispatch = useDispatch<AppDispatch>();

  // Get processing state from Redux store
  const { isLoading, error } = useSelector((state: RootState) => state.order);

  // Extract route params
  const {
    businessId,
    customerId,
    customerName,
    items,
    total,
    pickupDate,
    customerPreferences
  } = route.params || {};

  // State variables
  const [additionalNotes, setAdditionalNotes] = useState<string>(customerPreferences || '');
  const [dueDate, setDueDate] = useState<Date>(new Date(pickupDate || Date.now()));
  const [tip, setTip] = useState<string>('0.00');
  const [confirmationVisible, setConfirmationVisible] = useState<boolean>(false);

  const [selectedServiceId, setSelectedServiceId] = useState<string | undefined>(undefined);
  const [selectedItems, setSelectedItems] = useState<CartItem[]>(items || []);
  const [showCalendar, setShowCalendar] = useState(false);

  // Get categories and items from Redux store
  const { categories, isLoading: isLoadingCategories } = useSelector((state: RootState) => state.category);
  const { items: productItems, isLoading: isLoadingItems } = useSelector((state: RootState) => state.item);

  // Tax rate - this could be fetched from the backend or config
  const taxRate = 0.07; // 7% tax rate

  // Calculate the actual subtotal based on selected items
  const calculatedSubtotal = selectedItems.reduce(
    (sum, item) => sum + (item.price * item.quantity), 0
  );

  // For tip and totals calculation
  const tipAmount = parseFloat(tip) || 0;
  const calculatedTaxAmount = calculatedSubtotal * taxRate;
  const grandTotal = calculatedSubtotal + calculatedTaxAmount + tipAmount;
  // Function to handle adding new items to the order
  const handleAddItem = (newItem: CartItem) => {
    // Check if item already exists in the order
    const existingItemIndex = selectedItems.findIndex(item =>
      item.id === newItem.id && item.type === newItem.type
    );

    if (existingItemIndex !== -1) {
      // Item exists, update its quantity
      const updatedItems = [...selectedItems];
      updatedItems[existingItemIndex].quantity += 1;
      setSelectedItems(updatedItems);
    } else {
      // Item doesn't exist, add it
      setSelectedItems([...selectedItems, newItem]);
    }
  };

  // Function to remove an item from the order
  const handleRemoveItem = (itemId: string) => {
    const updatedItems = selectedItems.filter(item => item.id !== itemId);
    setSelectedItems(updatedItems);
  };

  // Fetch categories and items when component mounts or user changes
  useEffect(() => {
    if (user?.userId) {
      dispatch(fetchCategories(user.userId));
    }
  }, [dispatch, user?.userId]);

  // Fetch items when selectedServiceId changes
  useEffect(() => {
    if (selectedServiceId) {
      dispatch(fetchItems(selectedServiceId));
    }
  }, [dispatch, selectedServiceId]);



  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Handle tip input changes
  const handleTipChange = (value: string) => {
    // Filter out non-numeric characters except for the decimal point
    const numericValue = value.replace(/[^0-9.]/g, '');
    setTip(numericValue);
  };

  // Apply quick tip percentages
  const handleQuickTip = (percentage: number) => {
    const tipValue = (calculatedSubtotal * percentage).toFixed(2);
    setTip(tipValue);
  };

  // Process the order
  const handleProcessOrder = async () => {
    // Show confirmation first
    setConfirmationVisible(true);
  };

  const handleUpdateQuantity = (itemId: string, newQuantity: number) => {
    // Prevent quantity from going below 1
    if (newQuantity < 1) return;
    
    // Update the item quantity
    const updatedItems = selectedItems.map(item => 
      item.id === itemId ? { ...item, quantity: newQuantity } : item
    );
    
    // Update state with the new items array
    setSelectedItems(updatedItems);
  };

  // Confirm and create the order
  const confirmOrder = async () => {
    try {
      // Create order object from our selections
      const orderData = {
        customerId,
        businessId,
        items: selectedItems.map(item => ({
          itemId: item.id,
          quantity: item.quantity,
          price: item.price,
          type: item.type,
          serviceId: item.serviceId
        })),
        subtotal: calculatedSubtotal,
        tax: calculatedTaxAmount,
        tip: tipAmount,
        total: grandTotal,
        paymentMethod: 'CASH',
        amountTendered: grandTotal,
        change: 0,
        status: 'CREATED' as 'CREATED' | 'PROCESSING' | 'READY' | 'COMPLETED' | 'CANCELLED' | 'DELIVERY_SCHEDULED' | 'OUT_FOR_DELIVERY' | 'DELIVERED',
        pickupDate: dueDate.toISOString(), // Use the date from the date picker
        notes: additionalNotes,
      };

      // Dispatch create order action
      const resultAction = await dispatch(createOrder(orderData));

      if (createOrder.fulfilled.match(resultAction)) {
        // Order was created successfully
        const newOrder = resultAction.payload;

        // Close confirmation modal
        setConfirmationVisible(false);

        // Navigate to success screen
        navigation.navigate('OrderConfirmation', {
          orderNumber: newOrder.orderNumber,
          customerName,
          total: grandTotal,
          pickupDate: dueDate.toISOString()
        });
      } else {
        // If we got here, there was an error
        Alert.alert('Error', 'Failed to create order. Please try again.');
        setConfirmationVisible(false);
      }
    } catch (error) {
      console.error('Error creating order:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
      setConfirmationVisible(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerBar}>
        <View style={styles.customerInfo}>
          <Text style={styles.customerName}>Customer: {customerName}</Text>
          <Text style={styles.notes}>NOTES: {additionalNotes}</Text>
        </View>
      </View>

      <View style={styles.mainContent}>
        <View style={styles.leftColumn}>
          {/* Categories at the top as tabs */}
          <CheckoutServiceList
            categories={categories}
            onSelectService={(category) => {
              setSelectedServiceId(category.id);
              // No longer automatically adding service to the cart
            }}
            isLoading={isLoadingCategories}
          />

          {/* Add Service Button */}
          {selectedServiceId && (
            <View style={styles.addServiceButtonContainer}>
              <TouchableOpacity
                style={styles.addServiceButton}
                onPress={() => {
                  const service = categories.find(cat => cat.id === selectedServiceId);
                  if (service) {
                    handleAddItem({
                      id: service.id,
                      name: service.name,
                      price: service.price || 0,
                      quantity: 1,
                      type: 'service'
                    });
                  }
                }}
              >
                <Ionicons name="add-circle" size={16} color="#fff" />
                <Text style={styles.addButtonText}>Add to Order</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Products in a grid layout */}
          <View style={styles.productsSection}>
            <CheckoutProductList
              products={productItems}
              selectedServiceId={selectedServiceId}
              onSelectProduct={(product) => {
                handleAddItem({
                  id: product.id,
                  name: product.name,
                  price: product.price || 0,
                  quantity: 1,
                  type: 'product',
                  serviceId: product.categoryId
                });
              }}
              isLoading={isLoadingItems}
            />

            {/* Due Date Picker at bottom of product list */}
            <DueDatePicker
              selectedDate={dueDate}
              onDateChange={setDueDate}
            />
          </View>
        </View>
        {/* Right Column: Order Summary and Payment Section */}
        <View style={styles.rightColumn}>
          {/* Fixed Header with Title and Notes */}
          <View style={styles.fixedHeaderContainer}>
            <Text style={styles.sectionTitle}>Order Summary</Text>
          </View>

          {/* Order Summary Section - only showing items list */}
          <ScrollView style={styles.scrollableItemsContainer}>
            <OrderSummary
              items={selectedItems}
              subtotal={calculatedSubtotal}
              tax={calculatedTaxAmount}
              tip={tipAmount}
              total={grandTotal}
              onRemoveItem={handleRemoveItem}
              onUpdateQuantity={handleUpdateQuantity}
              showTotals={false}
              showTitle={false}
              dueDate={dueDate}
            />
          </ScrollView>

          {/* Fixed Process Order Button with Totals */}
          <View style={styles.fixedButtonContainer}>
            {/* Order totals */}
            <View style={styles.orderTotals}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>${calculatedSubtotal.toFixed(2)}</Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Tax</Text>
                <Text style={styles.summaryValue}>${calculatedTaxAmount.toFixed(2)}</Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Tip</Text>
                <Text style={styles.summaryValue}>${tipAmount.toFixed(2)}</Text>
              </View>

              <View style={styles.summaryTotalRow}>
                <Text style={styles.summaryTotalLabel}>Total</Text>
                <Text style={styles.summaryTotalValue}>${grandTotal.toFixed(2)}</Text>
              </View>
            </View>

            {/* Process order button */}
            <TouchableOpacity
              style={[
                styles.processButton,
                (selectedItems.length === 0 || isLoading) && styles.disabledButton
              ]}
              onPress={handleProcessOrder}
              disabled={selectedItems.length === 0 || isLoading}
            >
              <Text style={styles.processButtonText}>
                {isLoading ? 'Processing...' : 'Process Order'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>



      {/* Order Confirmation Modal */}
      <Modal
        visible={confirmationVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmationVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmationModal}>
            <Text style={styles.confirmationTitle}>Confirm Order</Text>
            <Text style={styles.confirmationText}>
              Total: ${grandTotal.toFixed(2)}
            </Text>
            <Text style={styles.confirmationText}>
              Due Date: {dueDate.toLocaleDateString()}
            </Text>
            <Text style={styles.confirmationText}>
              Pickup Date: {dueDate.toLocaleDateString()}
            </Text>

            <View style={styles.confirmationButtons}>
              <TouchableOpacity
                style={[styles.confirmButton, styles.cancelButton]}
                onPress={() => setConfirmationVisible(false)}
              >
                <Text style={styles.confirmButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.confirmButton, styles.confirmButtonPrimary]}
                onPress={confirmOrder}
              >
                <Text style={styles.confirmButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerBar: {
    backgroundColor: '#fff',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  customerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  customerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  notes: {
    fontSize: 14,
    color: '#555',
  },
  mainContent: {
    flex: 1,
    flexDirection: 'row',
  },
  leftColumn: {
    width: '67%',
    backgroundColor: '#fff',
    borderRightWidth: 1,
    borderRightColor: '#e0e0e0',
    display: 'flex',
    flexDirection: 'column',
  },
  productsSection: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  rightColumn: {
    width: '33%', // Takes 40% of the width
    backgroundColor: '#f8f8f8',
    height: '100%',
  },
  addServiceButtonContainer: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  addServiceButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },

  // Tip section
  tipSection: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 15,
    backgroundColor: '#fff',
  },
  tipInput: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 15,
    marginVertical: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 10,
  },
  tipDollarSign: {
    fontSize: 18,
    color: '#555',
    marginRight: 5,
  },
  tipAmountInput: {
    flex: 1,
    fontSize: 18,
    color: '#333',
    padding: 0,
  },
  quickTipButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 15,
  },
  quickTipButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    padding: 10,
    marginHorizontal: 4,
    borderRadius: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  quickTipText: {
    fontSize: 14,
    color: '#333',
  },
  // Process button
  processButton: {
    backgroundColor: '#4CAF50',
    margin: 15,
    padding: 15,
    borderRadius: 4,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#aaa',
  },
  processButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  // Notes section
  notesSection: {
    backgroundColor: '#fff',
    marginBottom: 15,
  },
  notesInput: {
    margin: 15,
    padding: 10,
    height: 100,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    textAlignVertical: 'top',
  },
  // Confirmation modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmationModal: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    width: '80%',
    maxWidth: 400,
  },
  confirmationTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  confirmationText: {
    fontSize: 16,
    marginBottom: 10,
  },
  confirmationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  confirmButton: {
    flex: 1,
    padding: 12,
    borderRadius: 4,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  confirmButtonPrimary: {
    backgroundColor: '#4CAF50',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  fixedButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  orderTotals: {
    marginBottom: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#555',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  summaryTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    marginTop: 3,
  },
  summaryTotalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  summaryTotalValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  fixedHeaderContainer: {
    backgroundColor: 'white',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    zIndex: 1,
  },
  scrollableItemsContainer: {
    flex: 1,
    marginTop: 5,
    marginBottom: 5,
  },
});

export default Checkout;
