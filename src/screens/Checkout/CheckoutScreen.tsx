import React, { useState, useEffect } from 'react';
import { View, Dimensions, SafeAreaView, Alert } from 'react-native';
import { RouteProp, useRoute, useNavigation, NavigationProp } from '@react-navigation/native';
import { Customer, Product } from '../../types';
import { useCategories } from '../../hooks/useCategories';
import { useProducts } from '../../hooks/useProducts';
import { CustomerHeader, ServiceTabBar, ProductGrid, OrderSummary, PickupCalendar, PaymentModal } from './';
import { hashString } from '../../utils/hashString';
import styles from './CheckoutScreen.styles';
import { createOrder } from '../../localdb/services/orderService';

// Route params type for navigation
interface CheckoutScreenRouteParams {
  customer: Customer;
}

// Define the navigation param list
type RootStackParamList = {
  Checkout: CheckoutScreenRouteParams;
  // Add other screens as needed
  Dashboard: undefined;
  Receipt: { orderDetails: any };
};

type CheckoutScreenRouteProp = RouteProp<RootStackParamList, 'Checkout'>;

interface OrderItem extends Product {
  quantity: number;
  options?: {
    starch?: 'none' | 'light' | 'medium' | 'heavy';
    pressOnly?: boolean;
    notes?: string[];
  };
}

interface CheckoutScreenProps {
  employeeId?: string;
  firstName?: string;
  lastName?: string;
  business?: any; 
  businessId?: string;
}

const CheckoutScreen: React.FC<CheckoutScreenProps> = ({ employeeId, firstName, lastName, business, businessId: propBusinessId }) => {
  const route = useRoute<CheckoutScreenRouteProp>();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { customer } = route.params;
  
  const businessId = propBusinessId || '';
  
  // Now use businessId to filter categories
  const { categories, loading: loadingCategories } = useCategories(businessId);
  // Category selection must come first so it is defined before useProducts
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // Safety check - if businessId is missing, show error
  useEffect(() => {
    if (!businessId) {
      console.error('[CheckoutScreen] Missing businessId for customer:', customer?._id);
      Alert.alert(
        "Error", 
        "Missing business information for this customer. Please update the customer record with a valid business ID.",
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
    }
  }, [businessId, customer, navigation]);

  // Ensure selectedCategory is defined before calling useProducts
  // Pass businessId as the first parameter, and selectedCategory as the second
  const { products, loading: loadingProducts, error: productsError } = useProducts(
    businessId, 
    selectedCategory || undefined
  );

  // Only log errors
  useEffect(() => {
    if (productsError) {
      console.error('[CheckoutScreen] Error loading products:', productsError);
    }
  }, [productsError]);
  
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [pickupDate, setPickupDate] = useState<Date | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  
  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [printReceipt, setPrintReceipt] = useState(true);
  
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
  
  // More robust initial category selection with better logging
  useEffect(() => {
    if (categories && Array.isArray(categories) && categories.length > 0) {
      if (!selectedCategory) {
        setSelectedCategory(categories[0]._id);
      } else {
        // Check if selected category still exists in the categories list
        const categoryExists = categories.some(cat => cat._id === selectedCategory);
        if (!categoryExists) {
          setSelectedCategory(categories[0]._id);
        }
      }
    }
  }, [categories, selectedCategory]);
  
  // Find selected category object
  const selectedCategoryObject = selectedCategory 
    ? categories.find(c => c._id === selectedCategory) 
    : null;
    
  // Get products either from the category object directly OR from the useProducts hook
  const categoryProducts = (selectedCategoryObject && 
                           selectedCategoryObject.products && 
                           selectedCategoryObject.products.length > 0)
    ? selectedCategoryObject.products.map((p: any) => ({ ...p }))  // Use products from category
    : (products || []);  // Fallback to useProducts hook results
    
  // Utility: get a unique key for an order item based on product id and options
  const getOrderItemKey = (product: Product, options: any) => {
    const optionsStr = options ? JSON.stringify(options) : '';
    return `${product._id}_${hashString(optionsStr)}`;
  };

  // Add item to order: if same product+options exists, increment qty; otherwise, add new line
  const handleAddItem = (product: Product, options?: any) => {
    setOrderItems(prevItems => {
      const orderOptions = options || {
        starch: (product as any).starch,
        pressOnly: (product as any).pressOnly,
        notes: Array.isArray((product as any).notes)
          ? (product as any).notes
          : (product as any).notes
            ? [(product as any).notes]
            : [],
      };
      const newKey = getOrderItemKey(product, orderOptions);
      const existingIndex = prevItems.findIndex(item => {
        const itemKey = getOrderItemKey(item, item.options);
        return itemKey === newKey;
      });
      if (existingIndex >= 0) {
        // Increment quantity for existing line
        const updated = [...prevItems];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + 1
        };
        return updated;
      } else {
        // Add new line for this unique product+options combo
        return [
          ...prevItems,
          { ...product, productName: product.name, quantity: 1, options: orderOptions }
        ];
      }
    });
  };

  // Update item quantity using unique key (product id + options hash)
  const handleUpdateQuantity = (itemKey: string, quantity: number) => {
    setOrderItems(prevItems => {
      if (quantity <= 0) {
        // Remove item if quantity is zero or negative
        return prevItems.filter(item => {
          const optionsStr = item.options ? JSON.stringify(item.options) : '';
          const key = `${item._id}_${hashString(optionsStr)}`;
          return key !== itemKey;
        });
      } else {
        // Update quantity for the correct instance only
        return prevItems.map(item => {
          const optionsStr = item.options ? JSON.stringify(item.options) : '';
          const key = `${item._id}_${hashString(optionsStr)}`;
          return key === itemKey ? { ...item, quantity } : item;
        });
      }
    });
  };

  
  // Update item options
  const handleUpdateOptions = (itemKey: string, update: any) => {
    setOrderItems(prevItems =>
      prevItems.map(item => {
        const optionsStr = item.options ? JSON.stringify(item.options) : '';
        const key = `${item._id}_${hashString(optionsStr)}`;
        return key === itemKey
          ? { ...item, options: { ...item.options, ...update } }
          : item;
      })
    );
  };


  // Calculate total price
  const calculateTotal = () => {
    return orderItems.reduce((total, item) => {
      const itemPrice = (item.price || 0) * item.quantity;
      return total + itemPrice;
    }, 0);
  };

  // Handle checkout process
  const handleCheckout = async () => {
    if (orderItems.length === 0) {
      Alert.alert("Error", "Please add items to the order");
      return;
    }
    
    if (!pickupDate) {
      Alert.alert("Error", "Please select a pickup date and time");
      return;
    }
    
    if (!employeeId) {
      Alert.alert("Error", "No employee is signed in. Please sign in to complete the order.");
      return;
    }
    
    if (!businessId) {
      Alert.alert("Error", "Missing business ID. Please ensure the business is properly set up.");
      return;
    }
    
    // Show payment selection modal
    setShowPaymentModal(true);
  };

  // Handle payment completion
  const handlePaymentComplete = async (method: 'cash' | 'card' | 'other') => {
  console.log('[DEBUG][Checkout] handlePaymentComplete called with method:', method);
    try {
      setIsProcessing(true);
      
      // Expand order items by quantity before saving
      const expandOrderItems = (items: typeof orderItems) => {
        return items.flatMap(item =>
          Array.from({ length: item.quantity }).map((_, i) => ({ ...item, quantity: 1, _expandedIdx: i + 1 }))
        );
      };
      const expandedOrderItems = expandOrderItems(orderItems);

      // Create the order in the local database
      const orderData = {
        customer,
        items: expandedOrderItems,
        total: calculateTotal(),
        pickupDate,
        employeeId: employeeId || 'unknown',
        employee: employeeId ? { firstName, lastName } : undefined,
        businessId: businessId || '',
        paymentMethod: method
      };
      
      // Debug log for paymentMethod
      console.log('[DEBUG][Checkout] orderData.paymentMethod:', orderData.paymentMethod);
      // Defensive: check paymentMethod
      if (!orderData.paymentMethod) {
        throw new Error('Missing payment method for order creation');
      }
      const createdOrder = await createOrder(orderData);
      
      // Handle receipt printing if enabled
      if (printReceipt) {
        try {
          // Import the printer service
          const printerService = await import('../../utils/PrinterService').then(m => m.default);
          
          // Print the receipt
          await printerService.printReceipt({
            businessName: business?.businessName || 'Your Business',
            orderNumber: createdOrder._id, // or use a formatted order number if available
            customerName: createdOrder.customerName || `${customer.firstName} ${customer.lastName}`,
            items: createdOrder.items,
            total: createdOrder.total,
            date: createdOrder.createdAt?.toLocaleString(),
            notes: createdOrder.notes?.join('\n')
          });
        } catch (printError) {
          console.error('[Checkout] Error printing receipt:', printError);
          // Show error but continue with checkout
          Alert.alert(
            "Printing Error", 
            "Failed to print receipt, but the order was created successfully."
          );
        }
      }
      
      // Show success message
      Alert.alert(
        "Order Placed",
        `Order for ${customer.firstName} ${customer.lastName} placed successfully! Pickup scheduled for ${pickupDate ? pickupDate.toLocaleString() : 'not specified'}.`,
        [
          { 
            text: "OK", 
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error) {
      console.error('[Checkout] Error processing order:', error);
      Alert.alert(
        "Error",
        "Failed to create order. Please try again."
      );
    } finally {
      setIsProcessing(false);
      setShowPaymentModal(false);
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <CustomerHeader customer={customer} />
      
      {isSmallScreen ? (
        // Small screen layout (stacked)
        <View style={styles.smallScreenContent}>
          <View style={styles.smallScreenLeftPanel}>
            <ServiceTabBar 
              categories={categories} 
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              isLoading={loadingCategories}
            />
            
            <View style={styles.productSection}>
              <ProductGrid 
                products={categoryProducts}
                onSelectProduct={handleAddItem}
                isLoading={loadingProducts}
                currentPage={currentPage}
                onChangePage={setCurrentPage}
              />
              
              <PickupCalendar 
                selectedDate={pickupDate}
                onSelectDate={setPickupDate}
              />
            </View>
          </View>
          
          <View style={styles.smallScreenRightPanel}>
            <OrderSummary 
              items={orderItems}
              onUpdateQuantity={handleUpdateQuantity}
              onUpdateOptions={handleUpdateOptions}
              total={calculateTotal()}
              onCheckout={handleCheckout}
            />
          </View>
        </View>
      ) : (
        // Regular layout (side-by-side)
        <View style={styles.content}>
          <View style={styles.leftPanel}>
            <ServiceTabBar 
              categories={categories} 
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              isLoading={loadingCategories}
            />
            
            <View style={styles.productSection}>
              <ProductGrid 
                products={categoryProducts}
                onSelectProduct={handleAddItem}
                isLoading={loadingProducts}
                currentPage={currentPage}
                onChangePage={setCurrentPage}
              />
              
              <PickupCalendar 
                selectedDate={pickupDate}
                onSelectDate={setPickupDate}
              />
            </View>
          </View>
          
          <View style={styles.rightPanel}>
            <OrderSummary 
              items={orderItems}
              onUpdateQuantity={handleUpdateQuantity}
              onUpdateOptions={handleUpdateOptions}
              total={calculateTotal()}
              onCheckout={handleCheckout}
            />
          </View>
        </View>
      )}
      
      {/* Payment Modal */}
      <PaymentModal
        visible={showPaymentModal}
        total={calculateTotal()}
        onClose={() => setShowPaymentModal(false)}
        onComplete={handlePaymentComplete}
        printReceipt={printReceipt}
        setPrintReceipt={setPrintReceipt}
        loading={isProcessing}
      />
    </SafeAreaView>
  );
};

export default CheckoutScreen;