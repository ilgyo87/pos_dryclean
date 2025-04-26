import React, { useState, useEffect } from 'react';
import { View, Dimensions, SafeAreaView, Alert } from 'react-native';
import { RouteProp, useRoute, useNavigation, NavigationProp } from '@react-navigation/native';
import { Customer, Product } from '../../types';
import { useCategories } from '../../hooks/useCategories';
import { useProducts } from '../../hooks/useProducts';
import { CustomerHeader, ServiceTabBar, ProductGrid, OrderSummary, PickupCalendar } from './';
import { hashString } from '../../utils/hashString';
import styles from './CheckoutScreen.styles';

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
  
  // Log customer info for debugging
  console.log('[CheckoutScreen] Customer info:', JSON.stringify({
    id: customer?._id,
    name: customer ? `${customer.firstName} ${customer.lastName}` : 'Unknown',
    businessId: businessId,
  }));
  
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
  
  // Log any errors with fetching products
  useEffect(() => {
    if (productsError) {
      console.error('[CheckoutScreen] Error loading products:', productsError);
    }
  }, [productsError]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [pickupDate, setPickupDate] = useState<Date | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  
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
    console.log(`[CheckoutScreen] Categories changed: ${categories?.length || 0} categories available`);
    if (categories && Array.isArray(categories)) {
      categories.forEach((cat, index) => {
        console.log(`[CheckoutScreen] Category ${index}: ${cat.name}, ID: ${cat._id}, businessId: ${cat.businessId}`);
      });
    }
    
    if (categories && categories.length > 0) {
      if (!selectedCategory) {
        console.log(`[CheckoutScreen] Setting initial category to: ${categories[0].name} (${categories[0]._id})`);
        setSelectedCategory(categories[0]._id);
      } else {
        // Check if selected category still exists in the categories list
        const categoryExists = categories.some(cat => cat._id === selectedCategory);
        if (!categoryExists && categories.length > 0) {
          console.log(`[CheckoutScreen] Selected category no longer exists, resetting to: ${categories[0].name}`);
          setSelectedCategory(categories[0]._id);
        }
      }
    } else {
      console.log('[CheckoutScreen] No categories available to select');
    }
  }, [categories, selectedCategory]);
  
  // Debug logs to help diagnose issues
  console.log('[CheckoutScreen] businessId:', businessId);
  console.log('[CheckoutScreen] selectedCategory:', selectedCategory);
  console.log('[CheckoutScreen] products.length:', products?.length || 0);
  
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
    
  // Log the selected category and its products (if any)
  if (selectedCategoryObject) {
    console.log(`[CheckoutScreen] Selected category: ${selectedCategoryObject.name}, ID: ${selectedCategoryObject._id}`);
    
    // If the products array exists on the category object, use it directly
    if (selectedCategoryObject.products && selectedCategoryObject.products.length > 0) {
      console.log(`[CheckoutScreen] Found ${selectedCategoryObject.products.length} products directly in category`);
    }
  }
  
  // Log the filtered products
  console.log('[CheckoutScreen] Products from useProducts hook:', products?.length || 0);
  console.log('[CheckoutScreen] Filtered products length:', categoryProducts.length);
  if (categoryProducts.length > 0) {
    console.log('[CheckoutScreen] First product:', JSON.stringify({
      name: categoryProducts[0].name,
      id: categoryProducts[0]._id,
      categoryId: categoryProducts[0].categoryId,
      businessId: categoryProducts[0].businessId,
    }));
  }
  
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
          { ...product, quantity: 1, options: orderOptions }
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
  const handleCheckout = () => {
    if (orderItems.length === 0) {
      Alert.alert("Error", "Please add items to the order");
      return;
    }
    
    if (!pickupDate) {
      Alert.alert("Error", "Please select a pickup date and time");
      return;
    }
    
    // Implement checkout logic here
    const orderDetails = {
      customer,
      items: orderItems,
      total: calculateTotal(),
      pickupDate,
      employeeId: employeeId || 'unknown',
      employee: employeeId ? { firstName, lastName } : undefined,
      dateCreated: new Date(),
      status: 'pending'
    };
    
    console.log('Checkout with:', orderDetails);
    
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
    
    // Navigate back to dashboard 
    // navigation.navigate('Receipt', { orderDetails });
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
    </SafeAreaView>
  );
};

export default CheckoutScreen;