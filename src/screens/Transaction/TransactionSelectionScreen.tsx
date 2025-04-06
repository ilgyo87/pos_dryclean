import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  Modal,
  useWindowDimensions
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { generateClient } from 'aws-amplify/data';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackScreenProps, NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { Schema } from '../../../amplify/data/resource';
import { Product } from '../../shared/types/productTypes';

// Initialize Amplify client
const client = generateClient<Schema>();

// Define types for our cart items
type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  type: 'category' | 'product';
  categoryId?: string; // For products, to track which category they belong to
  imageUrl?: string | null; // Add image URL for products
};

// Define category with products
type CategoryWithProducts = {
  category: Schema['Category']['type'];
  products: Product[];
};

// Define RootStackParamList if not defined elsewhere
type RootStackParamList = {
  TransactionSelection: {
    businessId: string;
    customerId: string;
    customerName: string;
  };
  Checkout: {
    businessId: string;
    customerId: string;
    customerName: string;
    items: CartItem[];
    total: number;
    pickupDate: string;
    customerPreferences: string;
  };
  // Add other screens as needed
};

type TransactionSelectionScreenProps = NativeStackScreenProps<RootStackParamList, 'TransactionSelection'>;

const TransactionSelectionScreen = () => {  
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'TransactionSelection'>>();
  
  const { businessId, customerId, customerName } = route.params || {};
  
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<CategoryWithProducts[]>([]);
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState(0);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [currentProductPage, setCurrentProductPage] = useState(0); // Track current page of products
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [customerPreferences, setCustomerPreferences] = useState<string>('');
  const [notesModalVisible, setNotesModalVisible] = useState(false);
  const [tempNotes, setTempNotes] = useState<string>('');
  
  // Get window dimensions for responsive layout
  const { width, height } = useWindowDimensions();
  
  // Set default pickup date (3 days from now)
  const getDefaultPickupDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 3);
    return date;
  };
  
  const [pickupDate, setPickupDate] = useState<Date>(getDefaultPickupDate());
  
  // Reset product page when changing categories
  useEffect(() => {
    setCurrentProductPage(0)  ;
  }, [selectedCategoryIndex]);
  
  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };
  
  useEffect(() => {
    if (!businessId) {
      Alert.alert('Error', 'Business ID is required');
      navigation.goBack();
      return;
    }
    
    fetchServicesAndProducts();
  }, [businessId]);

  const fetchServicesAndProducts = async () => {
    setLoading(true);
    try {
      // Fetch categories for this business
      const categoriesResult = await client.models.Category.list({
        filter: { businessID: { eq: businessId as string } }
      });
      
      if (categoriesResult.errors) {
        console.error('Error fetching categories:', categoriesResult.errors);
        Alert.alert('Error', 'Failed to fetch categories');
        setLoading(false);
        return;
      }
      
      const categoriesData = categoriesResult.data ?? [];
      
      if (categoriesData.length === 0) {
        setLoading(false);
        Alert.alert('No Categories', 'No categories found for this business. Please check with your administrator.');
        return;
      }
      
      // For each category, fetch related products
      const categoriesWithProducts: CategoryWithProducts[] = [];
      
      for (const category of categoriesData) {
        // Fetch products for this category
        const productsResult = await client.models.Item.list({
          filter: { categoryID: { eq: category.id } }
        });
        
        if (productsResult.errors) {
          console.error('Error fetching products for category:', category.id, productsResult.errors);
          continue;
        }
        
        // Sort products by createdAt date (oldest first)
        const sortedProducts = [...(productsResult.data ?? [])].sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateA - dateB; // Ascending order (oldest first)
        }).map(product => ({
          ...product,
          description: product.description || undefined // Convert null to undefined
        }));
        
        categoriesWithProducts.push({
          category,
          products: sortedProducts
        });
      }
      
      // Sort categories by createdAt date (oldest first)
      const sortedCategories = [...categoriesWithProducts].sort((a, b) => {
        const dateA = a.category.createdAt ? new Date(a.category.createdAt).getTime() : 0;
        const dateB = b.category.createdAt ? new Date(b.category.createdAt).getTime() : 0;
        return dateA - dateB; // Ascending order (oldest first)
      });
      
      setCategory(sortedCategories);
    } catch (error) {
      console.error('Error fetching categories and products:', error);
      Alert.alert('Error', 'Failed to fetch categories and products');
    } finally {
      setLoading(false);
    }
  };

  const handleViewProductDetails = (product: Product) => {
    // Add to cart directly instead of showing details
    addToCart(product, 'product', product.categoryID);
  };
  
  const addToCart = (item: Schema['Category']['type'] | Product, type: 'category' | 'product', categoryId?: string) => {
    // Check if item already exists in cart
    const existingItemIndex = cart.findIndex(
      cartItem => cartItem.id === item.id && cartItem.type === type
    );
    
    if (existingItemIndex >= 0) {
      // Item exists, update quantity
      const updatedCart = [...cart];
      updatedCart[existingItemIndex].quantity += 1;
      setCart(updatedCart);
    } else {
      // Add new item to cart
      setCart([
        ...cart,
        {
          id: item.id,
          name: item.name,
          price: type === 'product' ? (item as Product).price : 0,
          quantity: 1,
          type,
          categoryId: type === 'product' ? categoryId : undefined,
          imageUrl: type === 'product' ? (item as Product).urlPicture : null
        }
      ]);
    }
  };
  
  const removeFromCart = (itemId: string) => {
    setCart(cart.filter(item => item.id !== itemId));
  };
  
  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeFromCart(itemId);
      return;
    }
    
    setCart(
      cart.map(item => 
        item.id === itemId 
          ? { ...item, quantity: newQuantity } 
          : item
      )
    );
  };
  
  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };
  
  const handleCheckout = () => {
    if (cart.length === 0) {
      Alert.alert('Error', 'Please add items to your cart before proceeding');
      return;
    }
    
    // Prepare cart items for checkout screen
    const checkoutItems = cart.map(item => ({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      type: item.type,
      categoryId: item.categoryId,
      imageUrl: item.imageUrl
    }));
    
    // Navigate to checkout screen
    navigation.navigate('Checkout' as const, {
      businessId: businessId as string,
      customerId: customerId as string,
      customerName: customerName,
      items: checkoutItems,
      total: calculateTotal(),
      pickupDate: pickupDate.toISOString(),
      customerPreferences: customerPreferences
    });
  };
  
  // Render category tabs at the top
  const renderCategoryTabs = () => {
    return (
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.tabsContainer}
        contentContainerStyle={styles.tabsContent}
      >
        {category.map((categoryItem, index) => (
          <TouchableOpacity
            key={categoryItem.category.id}
            style={[
              styles.tabItem,
              selectedCategoryIndex === index && styles.tabItemActive
            ]}
            onPress={() => setSelectedCategoryIndex(index)}
          >
            <Text 
              style={[
                styles.tabText,
                selectedCategoryIndex === index && styles.tabTextActive
              ]}
            >
              {categoryItem.category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  // Render the selected category's content
  const renderSelectedCategoryContent = () => {
    if (category.length === 0) return null;
    
    const selectedCategory = category[selectedCategoryIndex];
    const { category: categoryData, products } = selectedCategory;
    return (
      <View style={styles.serviceContainer}>
        <View style={styles.serviceHeader}>
          <Text style={styles.serviceName}>{categoryData.name}</Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => addToCart(categoryData, 'category')}
          >
            <Text style={styles.addButtonText}>+ Add</Text>
          </TouchableOpacity>
        </View>
        
        {categoryData.description && (
          <Text style={styles.serviceDescription}>{categoryData.description}</Text>
        )}
        <Text style={styles.servicePrice}>Base Price: ${categoryData.price ? categoryData.price.toFixed(2) : '0.00'}</Text>
        
        <Text style={styles.productsHeader}>Products:</Text>
        
        {products.length > 0 ? (
          <FlatList
            data={products}
            keyExtractor={(item) => item.id}
            numColumns={2}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.productItem}
                onPress={() => addToCart(item, 'product', categoryData.id)}
              >
                {item.urlPicture && (
                  <Image 
                    source={{ uri: item.urlPicture }} 
                    style={styles.productImage} 
                    resizeMode="cover"
                  />
                )}
                <View style={styles.productInfo}>
                  <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.productPrice}>${item.price.toFixed(2)}</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        ) : (
          <Text style={styles.noProductsText}>No products available</Text>
        )}
      </View>
    );
  };

  // Render a cart item
  const renderCartItem = ({ item }: { item: CartItem }) => (
    <View style={styles.cartItem}>
      {item.imageUrl && item.type === 'product' && (
        <Image 
          source={{ uri: item.imageUrl }} 
          style={styles.cartItemImage} 
          resizeMode="cover"
        />
      )}
      <View style={styles.cartItemInfo}>
        <Text style={styles.cartItemName}>{item.name}</Text>
        <Text style={styles.cartItemPrice}>${item.price.toFixed(2)}</Text>
      </View>
      
      <View style={styles.quantityContainer}>
        <TouchableOpacity 
          style={styles.quantityButton}
          onPress={() => updateQuantity(item.id, item.quantity - 1)}
        >
          <Text style={styles.quantityButtonText}>-</Text>
        </TouchableOpacity>
        
        <Text style={styles.quantityText}>{item.quantity}</Text>
        
        <TouchableOpacity 
          style={styles.quantityButton}
          onPress={() => updateQuantity(item.id, item.quantity + 1)}
        >
          <Text style={styles.quantityButtonText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text style={styles.loadingText}>Loading categories and products...</Text>
        </View>
      ) : (
        <>
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
            
            <Text style={styles.headerTitle}>Select Items</Text>
            
            <View style={styles.headerRight} />
          </View>
          
          <View style={styles.customerInfo}>
            <Text style={styles.customerName}>Customer: {customerName}</Text>
            
            <TouchableOpacity
              style={styles.notesButton}
              onPress={() => setNotesModalVisible(true)}
            >
              <Text style={styles.notesButtonText}>
                {customerPreferences ? "Edit Notes" : "Add Notes"}
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* Main Content Area - Display as Two Columns */}
          <View style={styles.mainContentContainer}>
            {/* Left Column: Service Content */}
            <View style={styles.leftColumn}>
              {/* Service tabs */}
              {renderCategoryTabs()}
              
              {/* Selected service content */}
              <View style={styles.serviceContentScroll}>
    {renderSelectedCategoryContent()}
  </View>
              
              {/* Calendar Section - Moved here for better visibility */}
              <View style={styles.calendarSection}>
                <Text style={styles.calendarHeader}>Pickup Date:</Text>
                <TouchableOpacity
                  style={styles.datePickerButton}
                  onPress={() => setCalendarVisible(true)}
                >
                  <Text style={styles.datePickerText}>{formatDate(pickupDate)}</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Right Column: Cart Section */}
            <View style={styles.rightColumn}>
              <View style={styles.cartSection}>
                <View style={styles.cartHeader}>
                  <Text style={styles.cartTitle}>Cart ({cart.length} items)</Text>
                  
                  {cart.length > 0 && (
                    <TouchableOpacity
                      style={styles.clearCartButton}
                      onPress={() => setCart([])}
                    >
                      <Text style={styles.clearCartText}>Clear</Text>
                    </TouchableOpacity>
                  )}
                </View>
                
                {cart.length > 0 ? (
                  <>
                    <FlatList
                      data={cart}
                      keyExtractor={(item) => `${item.id}-${item.type}`}
                      renderItem={renderCartItem}
                      style={styles.cartList}
                    />
                    
                    <View style={styles.cartFooter}>
                      <View style={styles.totalSection}>
                        <Text style={styles.totalLabel}>Total:</Text>
                        <Text style={styles.totalAmount}>${calculateTotal().toFixed(2)}</Text>
                      </View>
                      
                      <TouchableOpacity
                        style={styles.checkoutButton}
                        onPress={handleCheckout}
                      >
                        <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                ) : (
                  <View style={styles.emptyCartContainer}>
                    <Text style={styles.emptyCartText}>Your cart is empty</Text>
                    <Text style={styles.emptyCartSubtext}>Add categories or products to get started</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
          
          {/* Calendar Modal */}
          <Modal
            visible={calendarVisible}
            transparent={true}
            animationType="slide"
          >
            <View style={styles.modalOverlay}>
              <View style={styles.calendarModal}>
                <Text style={styles.calendarHeader}>Select Pickup Date</Text>
                
                <Calendar
                  minDate={new Date().toISOString().split('T')[0]}
                  onDayPress={(day: any) => {
                    const selectedDate = new Date(day.dateString);
                    setPickupDate(selectedDate);
                    setCalendarVisible(false);
                  }}
                  markedDates={{
                    [pickupDate.toISOString().split('T')[0]]: { selected: true, selectedColor: '#2196F3' }
                  }}
                  theme={{
                    selectedDayBackgroundColor: '#2196F3',
                    todayTextColor: '#2196F3',
                    arrowColor: '#2196F3',
                  }}
                />
                
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setCalendarVisible(false)}
                >
                  <Text style={styles.closeButtonText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
          
          {/* Notes Modal */}
          <Modal
            visible={notesModalVisible}
            transparent={true}
            animationType="slide"
          >
            <View style={styles.modalOverlay}>
              <View style={styles.notesModal}>
                <Text style={styles.notesModalHeader}>Customer Preferences</Text>
                
                <TextInput
                  style={styles.notesInput}
                  placeholder="Enter special instructions or preferences..."
                  multiline={true}
                  value={tempNotes}
                  onChangeText={setTempNotes}
                />
                
                <View style={styles.notesButtonContainer}>
                  <TouchableOpacity
                    style={[styles.notesActionButton, styles.notesCancelButton]}
                    onPress={() => {
                      setTempNotes(customerPreferences);
                      setNotesModalVisible(false);
                    }}
                  >
                    <Text style={styles.notesButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.notesActionButton, styles.notesSaveButton]}
                    onPress={() => {
                      setCustomerPreferences(tempNotes);
                      setNotesModalVisible(false);
                    }}
                  >
                    <Text style={styles.notesSaveButtonText}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#2196F3',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerRight: {
    width: 50, // to balance the header
  },
  customerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#f0f8ff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  customerName: {
    fontSize: 16,
    fontWeight: '500',
  },
  notesButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  notesButtonText: {
    color: 'white',
    fontSize: 14,
  },
  
  // New two-column layout
  mainContentContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  leftColumn: {
    flex: 3, // Takes 60% of the width
    backgroundColor: '#fff',
  },
  rightColumn: {
    flex: 2, // Takes 40% of the width
    backgroundColor: '#f8f8f8',
    borderLeftWidth: 1,
    borderLeftColor: '#e0e0e0',
  },
  
  // Tabs styling
  tabsContainer: {
    backgroundColor: '#f9f9f9',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tabsContent: {
    paddingHorizontal: 10,
  },
  tabItem: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    marginHorizontal: 5,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: '#2196F3',
  },
  tabText: {
    fontSize: 15,
    color: '#777',
  },
  tabTextActive: {
    color: '#2196F3',
    fontWeight: 'bold',
  },
  
  // Service content styling
  serviceContentScroll: {
    height: '87%',
  },
  serviceContainer: {
    padding: 15,
    paddingBottom: 0, // Removed bottom padding to reduce the gap
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 5,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  serviceDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  productsHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  
  // Product styling
  productItem: {
    flex: 1,
    margin: 5,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  productImage: {
    width: '100%',
    height: 100,
    borderRadius: 5,
    marginBottom: 8,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  noProductsText: {
    fontSize: 14,
    color: '#888',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 10,
  },
  
  // Calendar section in left column
  calendarSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  calendarHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 10,
  },
  datePickerButton: {
    padding: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    flex: 1,
  },
  datePickerText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
  
  // Cart styling (right column)
  cartSection: {
    flex: 1,
    padding: 15,
  },
  cartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  clearCartButton: {
    padding: 5,
  },
  clearCartText: {
    fontSize: 14,
    color: '#f44336',
  },
  cartList: {
    flex: 1,
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  cartItemImage: {
    width: 40,
    height: 40,
    borderRadius: 5,
    marginRight: 10,
  },
  cartItemInfo: {
    flex: 1,
  },
  cartItemName: {
    fontSize: 15,
    color: '#333',
  },
  cartItemPrice: {
    fontSize: 14,
    color: '#555',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 15,
  },
  quantityButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  quantityText: {
    fontSize: 16,
    marginHorizontal: 10,
    width: 20,
    textAlign: 'center',
  },
  cartFooter: {
    marginTop: 'auto', // Push to bottom of section
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  totalLabel: {
    fontSize: 16,
    color: '#555',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  checkoutButton: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  checkoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyCartContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyCartText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#888',
    marginBottom: 5,
  },
  emptyCartSubtext: {
    fontSize: 14,
    color: '#aaa',
    textAlign: 'center',
  },
  
  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  calendarModal: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: '100%',
    maxWidth: 350,
  },
  closeButton: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 15,
  },
  closeButtonText: {
    fontSize: 16,
    color: '#333',
  },
  notesModal: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: '100%',
    maxWidth: 350,
  },
  notesModalHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 15,
  },
  notesButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  notesActionButton: {
    flex: 1,
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
  },
  notesCancelButton: {
    backgroundColor: '#f0f0f0',
    marginRight: 10,
  },
  notesSaveButton: {
    backgroundColor: '#2196F3',
  },
  notesSaveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default TransactionSelectionScreen;