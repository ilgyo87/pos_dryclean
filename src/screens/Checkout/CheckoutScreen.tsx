// src/screens/Checkout/CheckoutScreen.tsx - Updated with fixed props
import React, { useState, useEffect } from 'react';
import {
  View,
  Dimensions,
  SafeAreaView,
  Alert,
  BackHandler,
  StyleSheet,
  TouchableOpacity,
  Text
} from 'react-native';
import { RouteProp, useRoute, useNavigation, NavigationProp } from '@react-navigation/native';
import { 
  Customer, 
  Product, 
  Category, 
  OrderStatus,
  CheckoutItem
} from '../../types';
import { useCategories } from '../../hooks/useCategories';
import { useProducts } from '../../hooks/useProducts';
import { 
  CustomerHeader, 
  ServiceTabBar, 
  ProductGrid, 
  OrderSummary, 
  PickupCalendar,
  PaymentModal
} from './';
import CheckoutScreenCustomerFormModal from './CheckoutScreenCustomerFormModal';
import { generateClient } from 'aws-amplify/api';
import PrinterService from '../../utils/PrinterService';

// Order type interface - using existing Order interface properties but with CheckoutItem[]
interface OrderWithCheckoutItems {
  id: string;
  customerId: string;
  items: CheckoutItem[];
  total: number;
  status: OrderStatus;
  createdAt: Date;
  pickupDate: Date | null;
  employeeId: string;
  notes?: string;
}

// Route params type for navigation
interface CheckoutScreenRouteParams {
  customer: Customer;
}

// Define the navigation param list
export type RootStackParamList = {
  Checkout: CheckoutScreenRouteParams;
  DASHBOARD: undefined;
  OrderManagement: undefined;
  Receipt: { orderDetails: OrderWithCheckoutItems };
};

type CheckoutScreenRouteProp = RouteProp<RootStackParamList, 'Checkout'>;

interface CheckoutScreenProps {
  employeeId?: string;
  firstName?: string;
  lastName?: string;
}

const CheckoutScreen: React.FC<CheckoutScreenProps> = ({ 
  employeeId, 
  firstName, 
  lastName 
}) => {
  const route = useRoute<CheckoutScreenRouteProp>();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { customer } = route.params;
  const client = generateClient();

  // Track the current customer (for updates)
  const [currentCustomer, setCurrentCustomer] = useState<Customer>(customer);
  
  // Modal state for editing customer
  const [editCustomerModalVisible, setEditCustomerModalVisible] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);
  
  // Payment modal state
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'other'>('cash');
  const [paymentComplete, setPaymentComplete] = useState(false);
  
  // Receipt options
  const [printReceipt, setPrintReceipt] = useState(true);
  
  // Order state - using CheckoutItem[] as defined in types
  const [orderItems, setOrderItems] = useState<CheckoutItem[]>([]);
  const [pickupDate, setPickupDate] = useState<Date | null>(null);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  
  // UI state
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Handler to open modal
  const handleEditCustomer = () => {
    setCustomerToEdit(currentCustomer);
    setEditCustomerModalVisible(true);
  };

  // Handler for modal close
  const handleCustomerModalClose = () => {
    setEditCustomerModalVisible(false);
    setCustomerToEdit(null);
  };

  // Handler for modal success (update customer)
  const handleCustomerModalSuccess = (updatedCustomer?: Customer) => {
    setEditCustomerModalVisible(false);
    setCustomerToEdit(null);
    if (updatedCustomer) {
      setCurrentCustomer(updatedCustomer);
    }
  };

  const { categories, loading: loadingCategories } = useCategories();
  const { products, loading: loadingProducts } = useProducts();

  // Handle back button press - confirm before leaving if items in cart
  useEffect(() => {
    const handleBackPress = () => {
      if (orderItems.length > 0) {
        Alert.alert(
          'Discard Order?',
          'You have items in your order. Are you sure you want to go back and discard this order?',
          [
            { text: 'Cancel', style: 'cancel', onPress: () => {} },
            { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() }
          ]
        );
        return true; // Prevent default back button behavior
      }
      return false; // Allow default back button behavior
    };

    // Add back button handler
    BackHandler.addEventListener('hardwareBackPress', handleBackPress);

    // Clean up event listener
    return () => {
      BackHandler.removeEventListener('hardwareBackPress', handleBackPress);
    };
  }, [orderItems, navigation]);

  // Check screen size for responsive layout
  useEffect(() => {
    const updateLayout = () => {
      const { width } = Dimensions.get('window');
      setIsSmallScreen(width < 768); // Tablet breakpoint
    };

    // Set initial value
    updateLayout();

    // Listen for dimension changes (e.g., rotation)
    const subscription = Dimensions.addEventListener('change', updateLayout);

    return () => {
      // Clean up listener on component unmount
      subscription.remove();
    };
  }, []);

  // Initial category selection
  useEffect(() => {
    if (categories && categories.length > 0 && !selectedCategory) {
      setSelectedCategory(categories[0]._id);
    }
  }, [categories, selectedCategory]);

  // Filter products by selected category
  const categoryProducts = selectedCategory && products && products.length > 0
    ? products.filter(p => p.categoryId === selectedCategory)
    : [];

  // Add item to order
  const handleAddItem = (product: Product) => {
    setOrderItems(prevItems => {
      // Extract options from product
      const allowedStarch = ['none', 'light', 'medium', 'heavy'] as const;
      const starch = allowedStarch.includes(product.starch as any) 
        ? (product.starch as 'none' | 'light' | 'medium' | 'heavy') 
        : undefined;
      
      const options = {
        starch,
        pressOnly: Boolean(product.pressOnly),
        notes: '',
      };

      // Find an existing item with the same id and options
      const existingItemIndex = prevItems.findIndex(item => 
        item.id === product._id && 
        JSON.stringify(item.options) === JSON.stringify(options)
      );

      if (existingItemIndex >= 0) {
        // Increment quantity if found
        const updatedItems = [...prevItems];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + 1
        };
        return updatedItems;
      } else {
        // Add as new entry with options
        return [
          ...prevItems,
          {
            id: product._id,
            name: product.name,
            price: product.price || 0,
            quantity: 1,
            type: product.type as 'service' | 'product' || 'product',
            serviceId: product.serviceId,
            options
          }
        ];
      }
    });
  };

  // Update item quantity
  const handleUpdateQuantity = (itemId: string, options: any, quantity: number) => {
    setOrderItems(prevItems => {
      if (quantity <= 0) {
        // Remove item if quantity is zero or negative
        return prevItems.filter(item => 
          !(item.id === itemId && JSON.stringify(item.options) === JSON.stringify(options))
        );
      } else {
        // Update quantity for the matching item
        return prevItems.map(item => 
          (item.id === itemId && JSON.stringify(item.options) === JSON.stringify(options))
            ? { ...item, quantity }
            : item
        );
      }
    });
  };

  // Update item options
  const handleUpdateOptions = (itemId: string, oldOptions: any, newOptions: any) => {
    setOrderItems(prevItems => prevItems.map(item => 
      (item.id === itemId && JSON.stringify(item.options) === JSON.stringify(oldOptions))
        ? { ...item, options: { ...item.options, ...newOptions } }
        : item
    ));
  };

  // Handle edit item
  const handleEditItem = (item: CheckoutItem) => {
    // Implement item editing functionality
    console.log('Edit item:', item);
    // You could open a modal here to edit the item
  };

  // Calculate total price
  const calculateTotal = () => {
    return orderItems.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
  };

  // Open payment modal
  const handleProceedToPayment = () => {
    if (!pickupDate) {
      Alert.alert('Pickup Date Required', 'Please select a pickup date before proceeding to payment.');
      return;
    }
    
    if (orderItems.length === 0) {
      Alert.alert('Empty Order', 'Please add items to your order before proceeding to payment.');
      return;
    }
    
    setPaymentModalVisible(true);
  };

  // Handle payment completion
  const handlePaymentComplete = async (method: 'cash' | 'card' | 'other') => {
    try {
      setLoading(true);
      setPaymentMethod(method);
      
      // Create a new order
      const newOrder: OrderWithCheckoutItems = {
        id: `order-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        customerId: currentCustomer._id,
        items: orderItems,
        total: calculateTotal(),
        status: OrderStatus.PENDING,
        createdAt: new Date(),
        pickupDate: pickupDate,
        employeeId: employeeId || 'unknown',
        notes: ''
      };
      
      // Save order to database (implementation depends on your data layer)
      // This would typically be a call to your API or local database
      
      // Print QR code directly without saving
      await PrinterService.printQRCode(newOrder.id);
      
      // Print receipt if requested
      if (printReceipt) {
        // Use businessId as the business name, fallback to empty string if not present
        await PrinterService.printReceipt(newOrder, currentCustomer.businessId || '');
      }
      
      setTransactionId(newOrder.id);
      setPaymentComplete(true);
      setPaymentModalVisible(false);
      
      // Reset order state
      setOrderItems([]);
      setPickupDate(null);
      
      // Navigate to dashboard
      navigation.navigate('DASHBOARD');
      
    } catch (error) {
      console.error('Error completing payment:', error);
      Alert.alert('Payment Error', 'There was an error processing your payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <CustomerHeader 
        customer={currentCustomer} 
        onEdit={handleEditCustomer} 
      />
      
      {/* Customer Edit Modal */}
      <CheckoutScreenCustomerFormModal
        visible={editCustomerModalVisible}
        customer={customerToEdit}
        businessId={currentCustomer.businessId}
        onClose={handleCustomerModalClose}
        onSuccess={handleCustomerModalSuccess}
      />
      
      {/* Payment Modal */}
      <PaymentModal
        visible={paymentModalVisible}
        total={calculateTotal()}
        onClose={() => setPaymentModalVisible(false)}
        onComplete={handlePaymentComplete}
        printReceipt={printReceipt}
        setPrintReceipt={setPrintReceipt}
        loading={loading}
      />
      
      <View style={styles.contentContainer}>
        <View style={styles.leftPanel}>
          <ServiceTabBar
            categories={categories || []}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            isLoading={loadingCategories} // Changed from loading to isLoading
          />
          
          <ProductGrid
            products={categoryProducts}
            onAddItem={handleAddItem}
            loading={loadingProducts}
          />
        </View>
        
        <View style={styles.rightPanel}>
          <OrderSummary
            items={orderItems}
            onUpdateQuantity={handleUpdateQuantity}
            onUpdateOptions={handleUpdateOptions}
            total={calculateTotal()}
            onEdit={handleEditItem} // Added missing onEdit prop
          />
          
          <PickupCalendar
            selectedDate={pickupDate}
            onSelectDate={setPickupDate}
          />
          
          <TouchableOpacity
            style={styles.checkoutButton}
            onPress={handleProceedToPayment}
            disabled={orderItems.length === 0 || !pickupDate}
          >
            <Text style={styles.checkoutButtonText}>
              Proceed to Payment
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  leftPanel: {
    flex: 3,
    padding: 10,
  },
  rightPanel: {
    flex: 2,
    padding: 10,
    backgroundColor: '#ffffff',
    borderLeftWidth: 1,
    borderLeftColor: '#e0e0e0',
  },
  checkoutButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 20,
  },
  checkoutButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CheckoutScreen;
