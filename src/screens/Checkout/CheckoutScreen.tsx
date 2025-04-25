// src/screens/Checkout/CheckoutScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useWindowDimensions } from 'react-native';
import { View, Dimensions, SafeAreaView, Alert, BackHandler } from 'react-native';
import { RouteProp, useRoute, useNavigation, NavigationProp, ParamListBase } from '@react-navigation/native';
import { Customer, Product, Category } from '../../types';
import { useCategories } from '../../hooks/useCategories';
import { useProducts } from '../../hooks/useProducts';
import { CustomerHeader, ServiceTabBar, ProductGrid, OrderSummary, PickupCalendar } from './';
import CheckoutScreenCustomerFormModal from './CheckoutScreenCustomerFormModal';
import styles from './CheckoutScreen.styles';
import { hashString } from '../../utils/hashString';

// Route params type for navigation
interface CheckoutScreenRouteParams {
  customer: Customer;
}

// Define the navigation param list
export type RootStackParamList = {
  Checkout: CheckoutScreenRouteParams;
  DASHBOARD: undefined;
  Receipt: { orderDetails: any };
};

type CheckoutScreenRouteProp = RouteProp<RootStackParamList, 'Checkout'>;

interface OrderItem extends Product {
  quantity: number;
  options?: {
    starch?: 'none' | 'light' | 'medium' | 'heavy';
    pressOnly?: boolean;
    notes?: string;
  };
}

interface CheckoutScreenProps {
  employeeId?: string;
  firstName?: string;
  lastName?: string;
}

const CheckoutScreen: React.FC<CheckoutScreenProps> = ({ employeeId, firstName, lastName }) => {
  const route = useRoute<CheckoutScreenRouteProp>();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { customer } = route.params;

  // Track the current customer (for updates)
  const [currentCustomer, setCurrentCustomer] = useState<Customer>(customer);

  // Modal state for editing customer
  const [editCustomerModalVisible, setEditCustomerModalVisible] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);

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
  
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [pickupDate, setPickupDate] = useState<Date | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  
  // Handle back button press - confirm before leaving if items in cart
  useEffect(() => {
    const handleBackPress = () => {
      if (orderItems.length > 0) {
        Alert.alert(
          'Discard Order?',
          'You have items in your order. Are you sure you want to go back and discard this order?',
          [
            { text: 'Cancel', style: 'cancel', onPress: () => {} },
            { 
              text: 'Discard', 
              style: 'destructive',
              onPress: () => navigation.goBack()
            }
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

  // Detect horizontal orientation
  const { width, height } = useWindowDimensions();
  const isHorizontal = width > height;
  
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
      // Extract options from product, fallback to undefined if not present
      const allowedStarch = ['none', 'light', 'medium', 'heavy'] as const;
      const starch = allowedStarch.includes(product.starch as any)
        ? (product.starch as 'none' | 'light' | 'medium' | 'heavy')
        : undefined;
      const options = {
        starch,
        pressOnly: Boolean(product.pressOnly),
        notes: '',
      };

      // Generate unique key for this product configuration
      const optionsStr = JSON.stringify(options);
      const itemKey = `${product._id}_${hashString(optionsStr)}`;
      
      // Find an existing item with the same _id and the same options
      const existingItemIndex = prevItems.findIndex(item => {
        const currentOptionsStr = item.options ? JSON.stringify(item.options) : '';
        const currentKey = `${item._id}_${hashString(currentOptionsStr)}`;
        return currentKey === itemKey;
      });
      
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
          { ...product, quantity: 1, options }
        ];
      }
    });
  };


  // Update item quantity
  // Update item quantity by unique key (including options)
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
        // Update quantity for the matching key
        return prevItems.map(item => {
          const optionsStr = item.options ? JSON.stringify(item.options) : '';
          const key = `${item._id}_${hashString(optionsStr)}`;
          return key === itemKey ? { ...item, quantity } : item;
        });
      }
    });
  };

  
  // Update item options by key
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

  // Handle checkout process completion
  const handleCheckoutComplete = () => {
    // Reset order state
    setOrderItems([]);
    setPickupDate(null);
    // Navigate to dashboard using navigate instead of goBack
    console.log('[CheckoutScreen] Order completed, resetting state and navigating to dashboard');
    navigation.navigate('DASHBOARD');
    // Alternative: You can use replace to avoid adding to navigation history
    // navigation.replace('DASHBOARD');
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <CustomerHeader customer={currentCustomer} onEdit={handleEditCustomer} />

      {/* Customer Edit Modal */}
      <CheckoutScreenCustomerFormModal
        visible={editCustomerModalVisible}
        customer={customerToEdit}
        businessId={currentCustomer.businessId}
        onClose={handleCustomerModalClose}
        onSuccess={handleCustomerModalSuccess}
      />
      
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
                value={pickupDate ?? undefined}
                onChange={date => setPickupDate(date)}
              />
            </View>
          </View>
          
          <View style={styles.smallScreenRightPanel}>
            <OrderSummary 
              items={orderItems}
              onUpdateQuantity={handleUpdateQuantity}
              onUpdateOptions={handleUpdateOptions}
              total={calculateTotal()}
              onCheckout={handleCheckoutComplete}
              businessId={customer.businessId || ''}
              customerId={customer._id}
              employeeId={employeeId || ''}
              pickupDate={pickupDate}
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
                value={pickupDate ?? undefined}
                onChange={date => setPickupDate(date)}
              />
            </View>
          </View>
          
          <View style={[styles.rightPanel, isHorizontal && styles.rightPanelNarrow]}>
            <OrderSummary 
              items={orderItems}
              onUpdateQuantity={handleUpdateQuantity}
              onUpdateOptions={handleUpdateOptions}
              total={calculateTotal()}
              onCheckout={handleCheckoutComplete}
              businessId={customer.businessId || ''}
              customerId={customer._id}
              employeeId={employeeId || ''}
              pickupDate={pickupDate}
            />
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

export default CheckoutScreen;