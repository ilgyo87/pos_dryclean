import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles/screens/productManagementStyles';

// Initialize Amplify client
const client = generateClient<Schema>();

// Interface for route params
interface RouteParams {
  businessId: string;
}

// Service interface
interface Service {
  id: string;
  name: string;
  description?: string;
  price: number;
  category?: string;
  businessID: string;
}

// Product interface
interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  inventory?: number;
  businessID: string;
}

const ProductManagementScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { businessId } = route.params as RouteParams;

  // State for services and products
  const [services, setServices] = useState<Service[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // State for service modal
  const [isServiceModalVisible, setIsServiceModalVisible] = useState(false);
  const [isNewService, setIsNewService] = useState(true);
  const [editingService, setEditingService] = useState<Service | null>(null);
  
  // State for product modal
  const [isProductModalVisible, setIsProductModalVisible] = useState(false);
  const [isNewProduct, setIsNewProduct] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // State for delete confirmation
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: 'service' | 'product', id: string } | null>(null);
  
  // Form fields for service modal
  const [serviceName, setServiceName] = useState('');
  const [serviceDescription, setServiceDescription] = useState('');
  const [servicePrice, setServicePrice] = useState('');
  const [serviceCategory, setServiceCategory] = useState('');
  
  // Form fields for product modal
  const [productName, setProductName] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productInventory, setProductInventory] = useState('');


  // Fetch services and products from the database
  const fetchServicesAndProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch services
      const servicesResult = await client.models.Service.list({
        filter: { businessID: { eq: businessId } }
      });
      
      if (servicesResult.data) {
        const servicesData = servicesResult.data as unknown as Service[];
        setServices(servicesData);
        
        // Select the first service by default if none is selected
        if (servicesData.length > 0 && !selectedServiceId) {
          setSelectedServiceId(servicesData[0].id);
        }
      }
      
      // Fetch all products for this business
      const productsResult = await client.models.Product.list({
        filter: { businessID: { eq: businessId } }
      });
      
      const allProducts = productsResult.data ? productsResult.data as unknown as Product[] : [];
      
      setProducts(allProducts);
    } catch (error) {
      console.error('Error fetching services and products:', error);
      Alert.alert('Error', 'Failed to load services and products. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [businessId, selectedServiceId]);
  
  useEffect(() => {
    fetchServicesAndProducts();
  }, [fetchServicesAndProducts]);
  
  // Show all products since they're not tied to specific services
  const filteredProducts = products;

  // Get the selected service
  const selectedService = services.find(service => service.id === selectedServiceId);

  // Open service modal for adding a new service
  const handleAddService = () => {
    setIsNewService(true);
    setEditingService(null);
    setServiceName('');
    setServiceDescription('');
    setServicePrice('');
    setServiceCategory('');
    setIsServiceModalVisible(true);
  };

  // Open service modal for editing an existing service
  const handleEditService = (service: Service) => {
    setIsNewService(false);
    setEditingService(service);
    setServiceName(service.name);
    setServiceDescription(service.description || '');
    setServicePrice(service.price.toString());
    setServiceCategory(service.category || '');
    setIsServiceModalVisible(true);
  };

  // Save service (create or update)
  const handleSaveService = async () => {
    if (!serviceName.trim()) {
      Alert.alert('Error', 'Service name is required');
      return;
    }
    
    if (!servicePrice.trim() || isNaN(parseFloat(servicePrice))) {
      Alert.alert('Error', 'Please enter a valid price');
      return;
    }
    
    try {
      if (isNewService) {
        // Create new service
        const result = await client.models.Service.create({
          name: serviceName.trim(),
          description: serviceDescription.trim() || undefined,
          price: parseFloat(servicePrice),
          category: serviceCategory.trim() || undefined,
          businessID: businessId
        });
        
        if (result.data) {
          setServices(prev => [...prev, result.data as unknown as Service]);
          setSelectedServiceId(result.data.id);
        }
      } else if (editingService) {
        // Update existing service
        const result = await client.models.Service.update({
          id: editingService.id,
          name: serviceName.trim(),
          description: serviceDescription.trim() || undefined,
          price: parseFloat(servicePrice),
          category: serviceCategory.trim() || undefined
        });
        
        if (result.data) {
          setServices(prev => prev.map(s => 
            s.id === editingService.id ? result.data as unknown as Service : s
          ));
        }
      }
      
      setIsServiceModalVisible(false);
    } catch (error) {
      console.error('Error saving service:', error);
      Alert.alert('Error', 'Failed to save service. Please try again.');
    }
  };

  // Open product modal for adding a new product
  const handleAddProduct = () => {
  
    
    setIsNewProduct(true);
    setEditingProduct(null);
    setProductName('');
    setProductDescription('');
    setProductPrice('');
    setProductInventory('');

    setIsProductModalVisible(true);
  };

  // Open product modal for editing an existing product
  const handleEditProduct = (product: Product) => {
    setIsNewProduct(false);
    setEditingProduct(product);
    setProductName(product.name);
    setProductDescription(product.description || '');
    setProductPrice(product.price.toString());
    setProductInventory(product.inventory?.toString() || '');

    setIsProductModalVisible(true);
  };

  // Save product (create or update)
  const handleSaveProduct = async () => {
    if (!productName.trim()) {
      Alert.alert('Error', 'Product name is required');
      return;
    }
    
    if (!productPrice.trim() || isNaN(parseFloat(productPrice))) {
      Alert.alert('Error', 'Please enter a valid price');
      return;
    }
    
    try {
      if (isNewProduct) {
        // Create new product
        const result = await client.models.Product.create({
          name: productName.trim(),
          description: productDescription.trim() || undefined,
          price: parseFloat(productPrice),
          inventory: productInventory.trim() ? parseInt(productInventory) : undefined,
          businessID: businessId
        });
        
        if (result.data) {
          setProducts(prev => [...prev, result.data as unknown as Product]);
        }
      } else if (editingProduct) {
        // Update existing product
        const result = await client.models.Product.update({
          id: editingProduct.id,
          name: productName.trim(),
          description: productDescription.trim() || undefined,
          price: parseFloat(productPrice),
          inventory: productInventory.trim() ? parseInt(productInventory) : undefined
        });
        
        if (result.data) {
          setProducts(prev => prev.map(p => 
            p.id === editingProduct.id ? result.data as unknown as Product : p
          ));
        }
      }
      
      setIsProductModalVisible(false);
    } catch (error) {
      console.error('Error saving product:', error);
      Alert.alert('Error', 'Failed to save product. Please try again.');
    }
  };

  // Open delete confirmation modal
  const handleDeletePrompt = (type: 'service' | 'product', id: string) => {
    setItemToDelete({ type, id });
    setIsDeleteModalVisible(true);
  };

  // Delete service or product
  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    
    try {
      if (itemToDelete.type === 'service') {
        // Since products are not tied to services in our schema, we can delete services directly
        // No need to check for associated products
        
        // Delete service
        await client.models.Service.delete({ id: itemToDelete.id });
        setServices(prev => prev.filter(s => s.id !== itemToDelete.id));
        
        // If the deleted service was selected, select another one
        if (selectedServiceId === itemToDelete.id) {
          const remainingServices = services.filter(s => s.id !== itemToDelete.id);
          setSelectedServiceId(remainingServices.length > 0 ? remainingServices[0].id : null);
        }
      } else {
        // Delete product
        await client.models.Product.delete({ id: itemToDelete.id });
        setProducts(prev => prev.filter(p => p.id !== itemToDelete.id));
      }
      
      setIsDeleteModalVisible(false);
    } catch (error) {
      console.error('Error deleting item:', error);
      Alert.alert('Error', 'Failed to delete item. Please try again.');
    }
  };

  // Render product item
  const renderProductItem = ({ item }: { item: Product }) => (
    <View style={styles.productItem}>
      <View style={styles.productImageContainer}>
        <Text style={styles.productImagePlaceholder}>No Image</Text>
      </View>
      <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
      <Text style={styles.productDescription} numberOfLines={2}>
        {item.description || 'No description'}
      </Text>
      <Text style={styles.productPrice}>${item.price.toFixed(2)}</Text>
      <View style={styles.productActions}>
        <TouchableOpacity 
          style={styles.productActionButton}
          onPress={() => handleEditProduct(item)}
        >
          <Ionicons name="pencil" size={18} color="#2196F3" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.productActionButton}
          onPress={() => handleDeletePrompt('product', item.id)}
        >
          <Ionicons name="trash" size={18} color="#F44336" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Loading services and products...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.contentContainer}>
        {/* Header with add buttons */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Product Management</Text>
          <View style={{ flexDirection: 'row' }}>
            <TouchableOpacity 
              style={[styles.addButton, { marginRight: 8, backgroundColor: '#673AB7' }]}
              onPress={handleAddService}
            >
              <Ionicons name="add-circle-outline" size={18} color="white" />
              <Text style={styles.addButtonText}>Add Service</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={handleAddProduct}
              disabled={!selectedServiceId}
            >
              <Ionicons name="add-circle-outline" size={18} color="white" />
              <Text style={styles.addButtonText}>Add Product</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Service tabs */}
        {services.length > 0 ? (
          <>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.tabContainer}
            >
              {services.map((service) => (
                <TouchableOpacity
                  key={service.id}
                  style={[
                    styles.tab,
                    selectedServiceId === service.id && styles.activeTab
                  ]}
                  onPress={() => setSelectedServiceId(service.id)}
                >
                  <Text
                    style={[
                      styles.tabText,
                      selectedServiceId === service.id && styles.activeTabText
                    ]}
                  >
                    {service.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            {/* Selected service info */}
            {selectedService && (
              <View style={styles.serviceInfoContainer}>
                <Text style={styles.serviceTitle}>{selectedService.name}</Text>
                <Text style={styles.serviceDescription}>
                  {selectedService.description || 'No description provided.'}
                </Text>
                <View style={styles.servicePriceRow}>
                  <Text style={styles.servicePrice}>
                    Base Price: ${selectedService.price.toFixed(2)}
                  </Text>
                  <TouchableOpacity 
                    style={styles.editServiceButton}
                    onPress={() => handleEditService(selectedService)}
                  >
                    <Ionicons name="settings-outline" size={16} color="#666" />
                    <Text style={styles.editServiceText}>Edit Service</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            
            {/* Products section */}
            <View style={styles.productsHeaderRow}>
              <Text style={styles.productsHeaderTitle}>Products</Text>
              {filteredProducts.length > 0 && (
                <Text>{filteredProducts.length} item{filteredProducts.length !== 1 ? 's' : ''}</Text>
              )}
            </View>
            
            {products.length > 0 ? (
              <FlatList
                data={products}
                renderItem={renderProductItem}
                keyExtractor={(item) => item.id}
                numColumns={2}
                columnWrapperStyle={{ justifyContent: 'space-between' }}
                style={{ flex: 1 }}
              />
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="basket-outline" size={48} color="#ccc" />
                <Text style={styles.emptyText}>
                  No products found. Add your first product!
                </Text>
              </View>
            )}
          </>
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="briefcase-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>
              No services found. Start by adding your first service category!
            </Text>
          </View>
        )}
      </View>
      
      {/* Service Modal */}
      <Modal
        visible={isServiceModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsServiceModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>
              {isNewService ? 'Add New Service' : 'Edit Service'}
            </Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Service Name *</Text>
              <TextInput
                style={styles.input}
                value={serviceName}
                onChangeText={setServiceName}
                placeholder="Enter service name"
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={serviceDescription}
                onChangeText={setServiceDescription}
                placeholder="Enter service description"
                multiline
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Base Price *</Text>
              <TextInput
                style={styles.input}
                value={servicePrice}
                onChangeText={setServicePrice}
                placeholder="Enter base price"
                keyboardType="decimal-pad"
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Category</Text>
              <TextInput
                style={styles.input}
                value={serviceCategory}
                onChangeText={setServiceCategory}
                placeholder="Enter category (e.g., Cleaning, Alterations)"
              />
            </View>
            
            <View style={styles.buttonRow}>
              {!isNewService && (
                <TouchableOpacity
                  style={[styles.button, styles.deleteButton]}
                  onPress={() => {
                    setIsServiceModalVisible(false);
                    if (editingService) {
                      handleDeletePrompt('service', editingService.id);
                    }
                  }}
                >
                  <Text style={styles.actionButtonText}>Delete</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => setIsServiceModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={handleSaveService}
              >
                <Text style={styles.actionButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Product Modal */}
      <Modal
        visible={isProductModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsProductModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>
              {isNewProduct ? 'Add New Product' : 'Edit Product'}
            </Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Product Name *</Text>
              <TextInput
                style={styles.input}
                value={productName}
                onChangeText={setProductName}
                placeholder="Enter product name"
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={productDescription}
                onChangeText={setProductDescription}
                placeholder="Enter product description"
                multiline
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Price *</Text>
              <TextInput
                style={styles.input}
                value={productPrice}
                onChangeText={setProductPrice}
                placeholder="Enter price"
                keyboardType="decimal-pad"
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Inventory</Text>
              <TextInput
                style={styles.input}
                value={productInventory}
                onChangeText={setProductInventory}
                placeholder="Enter inventory count (optional)"
                keyboardType="number-pad"
              />
            </View>
            

            
            <View style={styles.buttonRow}>
              {!isNewProduct && (
                <TouchableOpacity
                  style={[styles.button, styles.deleteButton]}
                  onPress={() => {
                    setIsProductModalVisible(false);
                    if (editingProduct) {
                      handleDeletePrompt('product', editingProduct.id);
                    }
                  }}
                >
                  <Text style={styles.actionButtonText}>Delete</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => setIsProductModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={handleSaveProduct}
              >
                <Text style={styles.actionButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Delete Confirmation Modal */}
      <Modal
        visible={isDeleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsDeleteModalVisible(false)}
      >
        <View style={styles.alertOverlay}>
          <View style={styles.alertContainer}>
            <Text style={styles.alertTitle}>Confirm Delete</Text>
            <Text style={styles.alertMessage}>
              Are you sure you want to delete this {itemToDelete?.type}? This action cannot be undone.
            </Text>
            
            <View style={styles.alertButtonRow}>
              <TouchableOpacity
                style={[styles.alertButton, styles.alertCancelButton]}
                onPress={() => setIsDeleteModalVisible(false)}
              >
                <Text style={styles.alertCancelText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.alertButton, styles.alertConfirmButton]}
                onPress={handleDeleteConfirm}
              >
                <Text style={styles.alertConfirmText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default ProductManagementScreen;