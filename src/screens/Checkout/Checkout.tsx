// src/screens/Checkout/Checkout.tsx
import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { createOrder, createOrderItem } from '../../store/slices/OrderSlice';
import { fetchCategories } from '../../store/slices/CategorySlice';
import { fetchItems } from '../../store/slices/ItemSlice';
import { RootState, AppDispatch } from '../../store';

import OrderSummary from './components/OrderSummary';
import ReceiptModal from './components/ReceiptModal';
import { AuthUser } from "aws-amplify/auth";
import CheckoutServiceList from './components/CheckoutServiceList';
import CheckoutProductList from './components/CheckoutProductList';
import DueDatePicker from './components/DueDatePicker';
import { Ionicons } from '@expo/vector-icons';
import { usePrinter, PrintReceiptParams } from './hooks/usePrinter';

// Define the CartItem interface for items in the order
interface CartItem {
  id: string; // unique identifier for product or service
  name: string;
  price: number;
  quantity: number;
  type: 'service' | 'product';
  orderId: string;
  orderNumber: string;
}

const Checkout = ({ user, employee }: { user: AuthUser | null, employee: { id: string, name: string } | null }) => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const dispatch = useDispatch<AppDispatch>();

  // Local state for loading and errors
  const [localLoading, setLocalLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Extract route params
  const {
    businessId,
    customerId,
    customerName,
    items,
    total,
    pickupDate,
    customerPreferences,
    firstName,
    lastName
  } = route.params || {};

  // Get business data from Redux
  const { businesses } = useSelector((state: RootState) => state.business);
  const business = businesses.find(b => b.id === businessId) || businesses[0];
  const businessName = business?.name || "Dry Cleaning POS";

  // State variables
  const [additionalNotes, setAdditionalNotes] = useState<string>(customerPreferences || '');
  const [dueDate, setDueDate] = useState<Date>(new Date(pickupDate || Date.now() + 86400000)); // Default to tomorrow
  const [tip, setTip] = useState<string>('0.00');
  const [selectedServiceId, setSelectedServiceId] = useState<string | undefined>(undefined);
  const [selectedItems, setSelectedItems] = useState<CartItem[]>(items || []);
  const [receiptVisible, setReceiptVisible] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<any>(null);
  const [orderNumber, setOrderNumber] = useState<string>("");

  // Use the printer hook
  const {
    isPrinting,
    isPrintingError,
    handlePrint,
    discoverPrinters
  } = usePrinter();

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
    // Check if item already exists in the order by id and type
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

  // Function to update item quantity
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

  // Generate order notes including employee information
  const generateOrderNotes = (): string => {
    let notes = additionalNotes ? additionalNotes + '\n\n' : '';

    // Add employee information if available
    if (employee) {
      notes += `Order created by: ${employee.name}`;
    } else {
      notes += 'Order created via self-service';
    }

    return notes;
  };

  // Process the order
  const handleProcessOrder = async () => {
    if (selectedItems.length === 0) {
      Alert.alert('No items selected', 'Please add at least one item to the order.');
      return;
    }
    setLocalLoading(true);
    setLocalError(null);

    try {

      // Generate order notes with employee information
      const notes = generateOrderNotes();

      // 1. Create the order WITH customer details and employee notes
      const orderPayload = {
        customerId,
        firstName,
        lastName,
        businessId,
        subtotal: calculatedSubtotal,
        tax: calculatedTaxAmount,
        tip: tipAmount,
        total: grandTotal,
        paymentMethod: 'CASH',
        amountTendered: grandTotal,
        change: 0,
        status: "CREATED" as const,
        pickupDate: dueDate.toISOString(),
        notes: notes,
        employeeId: employee?.id,
      };
      // Log payload for debugging
      console.log('Creating order with payload:', JSON.stringify(orderPayload, null, 2));

      const resultAction = await dispatch(createOrder(orderPayload));

      // Check if the action was fulfilled (success)
      if (!createOrder.fulfilled.match(resultAction)) {
        setLocalError('Failed to create order.');
        setLocalLoading(false);
        return;
      }

      // Check if payload exists and contains the expected data
      if (!resultAction.payload || !resultAction.payload.order) {
        setLocalError('Order creation failed: No payload returned.');
        setLocalLoading(false);
        return;
      }

      const newOrder = resultAction.payload.order;
      const orderId = newOrder.id;
      const orderNum = newOrder.orderNumber;

      // Store the created order details in state
      setCreatedOrder(newOrder);
      setOrderNumber(orderNum);

      // 2. Create all order items, each referencing the new orderId/orderNumber
      if (orderId && orderNum) {
        await Promise.all(selectedItems.map(async item => {
          // Create a cleaned order item object with only the fields defined in the schema
          const orderItemInput = {
            orderId,
            orderNumber: orderNum,
            quantity: item.quantity,
            price: item.price
          };

          console.log('Creating order item with input:', JSON.stringify(orderItemInput, null, 2));

          try {
            const result = await dispatch(createOrderItem(orderItemInput));
            if (!createOrderItem.fulfilled.match(result)) {
              console.error('Failed to create order item:', result.payload);
            }
          } catch (error) {
            console.error('Error creating order item:', error);
          }
        }));
      } else {
        setLocalError('Missing orderId or orderNumber.');
        setLocalLoading(false);
        return;
      }

      setReceiptVisible(true);
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : 'Failed to process order.');
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setLocalLoading(false);
    }
  };

  // Handle printing the receipt
  const handlePrintReceipt = async () => {
    // Only proceed if we have a valid order number
    if (!orderNumber) {
      Alert.alert("Error", "Order number is missing. Cannot print receipt.");
      return;
    }

    // Get employee name for receipt
    const employeeName = employee ? employee.name : 'Self-Service';

    const receiptData: PrintReceiptParams = {
      businessName,
      orderNumber: orderNumber,
      customerName,
      pickupDate: dueDate.toLocaleDateString(),
      items: selectedItems.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price
      })),
      subtotal: calculatedSubtotal,
      tax: calculatedTaxAmount,
      tip: tipAmount,
      total: grandTotal,
      paymentMethod: 'CASH',
      employeeName: employeeName  // Add employee name to the receipt
    };

    // Initialize printer discovery
    await discoverPrinters();

    // Handle printing
    await handlePrint(receiptData);
  };

  // Complete the order and return to dashboard
  const handleCompleteOrder = () => {
    // Close the receipt modal first
    setReceiptVisible(false);

    // Reset the checkout form state
    setSelectedItems([]);
    setOrderNumber("");
    setCreatedOrder(null);

    // Navigate to dashboard with REPLACE instead of NAVIGATE
    // This removes the current screen from the navigation stack,
    // preventing the user from going back to the checkout screen
    navigation.reset({
      index: 0,
      routes: [{ name: 'DASHBOARD' }],
    });
  };


  return (
    <View style={styles.container}>
      <View style={styles.headerBar}>
        <View style={styles.customerInfo}>
          <Text style={styles.customerName}>Customer: {customerName}</Text>
          <Text style={styles.notes}>NOTES: {additionalNotes}</Text>
        </View>
        {employee && (
          <Text style={styles.employeeInfo}>Employee: {employee.name}</Text>
        )}
      </View>

      <View style={styles.mainContent}>
        <View style={styles.leftColumn}>
          {/* Categories at the top as tabs */}
          <CheckoutServiceList
            categories={categories}
            onSelectService={(category) => {
              setSelectedServiceId(category.id);
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
                      type: 'service',
                      orderId: createdOrder?.id || '',
                      orderNumber: orderNumber || ''
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
                  orderId: createdOrder?.id || '',
                  orderNumber: orderNumber || ''
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
          {/* Fixed Header with Title */}
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
                (selectedItems.length === 0 || localLoading) && styles.disabledButton
              ]}
              onPress={handleProcessOrder}
              disabled={selectedItems.length === 0 || localLoading}
            >
              <Text style={styles.processButtonText}>
                {localLoading ? 'Processing...' : 'Process Order'}
              </Text>
            </TouchableOpacity>

            {localError && (
              <Text style={styles.errorText}>{localError}</Text>
            )}
          </View>
        </View>
      </View>

      {/* Receipt Modal */}
      {orderNumber && (
        <ReceiptModal
          visible={receiptVisible}
          onClose={handleCompleteOrder}
          onComplete={handleCompleteOrder}
          onPrint={handlePrintReceipt}
          isPrinting={isPrinting}
          isPrintingError={isPrintingError}
          employeeName={employee?.name || 'Self-Service'} // Now as a direct prop
          orderDetails={{
            orderNumber: orderNumber,
            customerName,
            items: selectedItems,
            subtotal: calculatedSubtotal,
            tax: calculatedTaxAmount,
            tip: tipAmount,
            total: grandTotal,
            paymentMethod: 'CASH',
            pickupDate: dueDate.toISOString(),
            employeeName: employee?.name || 'Self-Service'
          }}
          businessName={businessName}
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
  employeeInfo: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
    marginTop: 5,
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
    width: '33%',
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
    marginBottom: 130, // Add enough space to see all items above the fixed bottom container
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginTop: 5,
  }
});

export default Checkout;