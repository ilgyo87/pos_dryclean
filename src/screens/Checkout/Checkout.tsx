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
          <Text style={styles.pickupDate}>Pickup: {formatDate(pickupDate)}</Text>
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
              onDateChange={(date) => setDueDate(date)}
            />
          </View>
        </View>
        {/* Right Column: Order Summary and Payment Section */}
        <View style={styles.rightColumn}>
          <ScrollView>
            {/* Order Summary Section */}
            <OrderSummary
              items={selectedItems}
              subtotal={calculatedSubtotal}
              tax={calculatedSubtotal * taxRate}
              tip={tipAmount}
              total={calculatedSubtotal + (calculatedSubtotal * taxRate) + tipAmount}
              onRemoveItem={handleRemoveItem}
            />

            {/* Tip Section */}
            <View style={styles.tipSection}>
              <Text style={styles.sectionTitle}>Add Tip</Text>
              <View style={styles.tipInput}>
                <Text style={styles.tipDollarSign}>$</Text>
                <TextInput
                  style={styles.tipAmountInput}
                  keyboardType="decimal-pad"
                  value={tip}
                  onChangeText={handleTipChange}
                  placeholder="0.00"
                />
              </View>

              <View style={styles.quickTipButtons}>
                <TouchableOpacity
                  style={styles.quickTipButton}
                  onPress={() => handleQuickTip(0.15)}
                >
                  <Text style={styles.quickTipText}>15%</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.quickTipButton}
                  onPress={() => handleQuickTip(0.18)}
                >
                  <Text style={styles.quickTipText}>18%</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.quickTipButton}
                  onPress={() => handleQuickTip(0.20)}
                >
                  <Text style={styles.quickTipText}>20%</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.quickTipButton}
                  onPress={() => handleQuickTip(0.25)}
                >
                  <Text style={styles.quickTipText}>25%</Text>
                </TouchableOpacity>
              </View>
            </View>


            {/* Process Order Button */}
            <TouchableOpacity
              style={[styles.processButton, isLoading && styles.disabledButton]}
              onPress={handleProcessOrder}
              disabled={isLoading}
            >
              <Text style={styles.processButtonText}>
                {isLoading ? 'Processing...' : 'Process Order'}
              </Text>
            </TouchableOpacity>

            {/* Customer Notes */}
            <View style={styles.notesSection}>
              <Text style={styles.sectionTitle}>Additional Notes</Text>
              <TextInput
                style={styles.notesInput}
                multiline
                numberOfLines={3}
                value={additionalNotes}
                onChangeText={setAdditionalNotes}
                placeholder="Add special instructions or notes here..."
              />
            </View>
          </ScrollView>
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
  pickupDate: {
    fontSize: 14,
    color: '#555',
  },
  mainContent: {
    flex: 1,
    flexDirection: 'row',
  },
  leftColumn: {
    flex: 3, // Takes 60% of the width
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
    flex: 2, // Takes 40% of the width
    backgroundColor: '#f8f8f8',
    height: '100%', // Make sure it stretches the full height
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
});

export default Checkout;
