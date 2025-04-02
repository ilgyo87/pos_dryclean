import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Image,
} from 'react-native';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { useRoute } from '@react-navigation/native';
import { styles } from '../styles/screens/productManagementStyles';

// Import components
import ServiceTabs from '../components/ServiceTabs';
import ServiceModal from '../components/ServiceModal';
import ProductModal from '../components/ProductModal';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';
import ProductItem from '../components/ProductItem';

// Import types
import { Service, Product, RouteParams } from '../types/productTypes';
import { Alert } from 'react-native';

// Initialize Amplify client
const client = generateClient<Schema>();

// Define 4x4 grid = 8 items per page
const ITEMS_PER_PAGE = 8;

const ProductManagementScreen: React.FC = () => {
  const route = useRoute();
  const { businessId } = route.params as RouteParams;

  // State for services and products
  const [services, setServices] = useState<Service[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Client-side mapping of products to services
  const [productServiceMap, setProductServiceMap] = useState<Record<string, string>>({});

  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // State for modals
  const [isServiceModalVisible, setIsServiceModalVisible] = useState(false);
  const [isProductModalVisible, setIsProductModalVisible] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);

  // State for editing
  const [isNewService, setIsNewService] = useState(true);
  const [isNewProduct, setIsNewProduct] = useState(true);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [itemToDelete, setItemToDelete] = useState<{ type: 'service' | 'product', id: string } | null>(null);

  // Fetch services and products from the database
  const fetchServicesAndProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch categories (formerly services)
      const categoriesResult = await client.models.Category.list({
        filter: { businessID: { eq: businessId } }
      });

      console.log('Fetched categories:', categoriesResult.data);

      if (categoriesResult.data) {
        // Convert to Service type expected by the component
        const servicesData = categoriesResult.data.map(category => ({
          id: category.id,
          name: category.name,
          description: category.description || '',
          businessID: category.businessID,
          // Add any other fields needed by the Service type
          price: 0, // Default value since Category doesn't have price
          urlPicture: '' // Default value since Category doesn't have urlPicture
        })) as unknown as Service[];

        setServices(servicesData);

        // Select the first category by default if none is selected
        if (servicesData.length > 0 && !selectedServiceId) {
          setSelectedServiceId(servicesData[0].id);
          console.log('Setting default selected category:', servicesData[0].id);
        }
      }

      // Fetch all items (formerly products) for this business
      const itemsResult = await client.models.Item.list({
        filter: { businessID: { eq: businessId } }
      });

      console.log('Fetched items:', itemsResult.data);

      // Convert to Product type expected by the component
      const allProducts = itemsResult.data ? itemsResult.data.map(item => {
        console.log('Mapping item to product:', {
          id: item.id,
          name: item.name,
          imageUrl: item.imageUrl || ''
        });
        
        return {
          id: item.id,
          name: item.name,
          description: item.description || '',
          price: item.price,
          sku: item.sku || '',
          imageUrl: item.imageUrl || '',
          taxable: item.taxable || false,
          businessID: item.businessID,
          serviceID: item.categoryID, // Use categoryID as serviceID
          createdAt: item.createdAt
        };
      }) as unknown as Product[] : [];

      setProducts(allProducts);

      // Initialize product to service mapping if empty
      setProductServiceMap(prevMap => {
        if (Object.keys(prevMap).length === 0 && allProducts.length > 0 && categoriesResult.data) {
          const servicesData = categoriesResult.data.map(category => ({
            id: category.id,
            name: category.name,
            description: category.description || '',
            businessID: category.businessID
          })) as unknown as Service[];

          if (servicesData.length > 0) {
            // Create a map of product ID to service ID
            const initialMap: Record<string, string> = {};
            allProducts.forEach((product, index) => {
              // Distribute products evenly among services
              const serviceIndex = index % servicesData.length;
              initialMap[product.id] = servicesData[serviceIndex].id;
            });
            console.log('Created initial product-service mapping:', initialMap);
            return initialMap;
          }
        }
        console.log('Existing product-service mapping:', prevMap);
        return prevMap;
      });

      // Calculate total pages for pagination
      setTotalPages(Math.ceil(allProducts.length / ITEMS_PER_PAGE));
    } catch (error) {
      console.error('Error fetching services and products:', error);
    } finally {
      setIsLoading(false);
    }
  }, [businessId]);

  // Also need to add useEffect to call the function
  useEffect(() => {
    const fetchServicesAndProducts = async () => {
      setIsLoading(true);
      try {
        console.log('Fetching services and products...');
  
        // Fetch categories
        const categoriesResult = await client.models.Category.list({
          filter: { businessID: { eq: businessId } }
        });
        console.log('Categories fetched:', categoriesResult.data?.length);
  
        // Fetch items
        const itemsResult = await client.models.Item.list({
          filter: { businessID: { eq: businessId } }
        });
        console.log('Items fetched:', itemsResult.data?.length);
        console.log('Raw items data:', JSON.stringify(itemsResult.data?.slice(0, 2), null, 2));

        // Convert to Service type expected by the component
        const allServices = categoriesResult.data ? categoriesResult.data.map(category => ({
          id: category.id,
          name: category.name,
          description: category.description || '',
          businessID: category.businessID,
          products: []
        })) as unknown as Service[] : [];
        
        console.log('Mapped services:', allServices.length);
        console.log('First few services:', allServices.slice(0, 3).map(s => ({ id: s.id, name: s.name })));

        // Convert to Product type expected by the component
        const allProducts = itemsResult.data ? itemsResult.data.map(item => ({
          id: item.id,
          name: item.name,
          description: item.description || '',
          price: item.price,
          sku: item.sku || '',
          imageUrl: item.imageUrl || '',
          taxable: item.taxable,
          businessID: item.businessID,
          serviceID: item.categoryID, // Use categoryID as serviceID
          createdAt: item.createdAt
        })) as unknown as Product[] : [];
        
        console.log('Mapped products:', allProducts.length);
        console.log('First few products:', allProducts.slice(0, 3).map(p => ({ 
          id: p.id, 
          name: p.name, 
          serviceID: p.serviceID, 
          urlPicture: p.urlPicture 
        })));

        setServices(allServices);
        setProducts(allProducts);
        
        // Select the first service by default if we don't have one selected
        if (allServices.length > 0 && !selectedServiceId) {
          console.log('Setting initial selected service to:', allServices[0].id);
          setSelectedServiceId(allServices[0].id);
        } else {
          console.log('Selected service ID remains:', selectedServiceId);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        Alert.alert('Error', 'Failed to load services and products');
      } finally {
        setIsLoading(false);
      }
    };

    if (businessId) {
      fetchServicesAndProducts();
    }
  }, [businessId, refreshKey, selectedServiceId]);
  // Handle service tab selection without refreshing all data
  const handleServiceSelect = (serviceId: string) => {
    setSelectedServiceId(serviceId);
    setCurrentPage(0); // Reset to first page when switching services
  };

  // Filter products by the selected service
  const filteredProducts = useMemo(() => {
    console.log('Filtering products for service ID:', selectedServiceId);
    console.log('Total products before filtering:', products.length);
    
    if (!selectedServiceId) {
      console.log('No selected service ID, returning all products');
      return [...products].sort((a, b) => {
        // Sort by createdAt (oldest first)
        if (a.createdAt && b.createdAt) {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        // Handle cases where one record doesn't have createdAt
        if (a.createdAt) return -1;
        if (b.createdAt) return 1;
        // Fall back to sorting by name
        return a.name.localeCompare(b.name);
      });
    }

    // Filter by service ID first, then sort
    const filtered = products.filter(product => product.serviceID === selectedServiceId);

    // Sort filtered products by createdAt
    return filtered.sort((a, b) => {
      if (a.createdAt && b.createdAt) {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (a.createdAt) return -1;
      if (b.createdAt) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [products, selectedServiceId]);

  // Update pagination when filtered products change
  useEffect(() => {
    setTotalPages(Math.ceil(filteredProducts.length / ITEMS_PER_PAGE));
    // Reset to first page when changing services
    setCurrentPage(0); // Changed from 1 to 0 for 0-indexing
  }, [filteredProducts, ITEMS_PER_PAGE]);

  // Calculate paginated products based on filtered products
  const paginatedProducts = useMemo(() => {
    const startIndex = currentPage * ITEMS_PER_PAGE;
    return filteredProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage, ITEMS_PER_PAGE]);

  // Pagination handlers
  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Open service modal for adding a new service
  const handleAddService = () => {
    setIsNewService(true);
    setEditingService(null);
    setIsServiceModalVisible(true);
  };

  // Open service modal for editing an existing service
  const handleEditService = (service: Service) => {
    setIsNewService(false);
    setEditingService(service);
    setIsServiceModalVisible(true);
  };

  // Open product modal for adding a new product
  const handleAddProduct = () => {
    setIsNewProduct(true);
    setEditingProduct(null);
    setIsProductModalVisible(true);
  };

  // Open product modal for editing an existing product
  const handleEditProduct = (product: Product) => {
    setIsNewProduct(false);
    setEditingProduct(product);
    setIsProductModalVisible(true);
  };

  // Open delete confirmation modal
  const handleDeletePrompt = (type: 'service' | 'product', id: string) => {
    setItemToDelete({ type, id });
    setIsDeleteModalVisible(true);
  };

  // Handle service save
  const handleSaveService = async (serviceData: {
    name: string;
    description: string;
    price: string;
    urlPicture: string;
  }) => {
    try {
      if (isNewService) {
        // Create new category (formerly service)
        const result = await client.models.Category.create({
          name: serviceData.name.trim(),
          description: serviceData.description.trim() || undefined,
          businessID: businessId
          // Note: price and urlPicture are not part of Category model
        });

        if (result.data) {
          // Convert to Service type for UI
          const newService = {
            id: result.data.id,
            name: result.data.name,
            description: result.data.description || '',
            businessID: result.data.businessID,
            price: parseFloat(serviceData.price), // Store locally only
            urlPicture: serviceData.urlPicture.trim() || undefined // Store locally only
          } as unknown as Service;

          setServices(prev => [...prev, newService]);
          setSelectedServiceId(result.data.id);
        }
      } else if (editingService) {
        // Update existing category
        const result = await client.models.Category.update({
          id: editingService.id,
          name: serviceData.name.trim(),
          description: serviceData.description.trim() || undefined,
          // Note: price and urlPicture are not updated in the database
        });

        if (result.data) {
          // Update local state with all fields including UI-only ones
          const updatedService = {
            ...editingService,
            name: serviceData.name.trim(),
            description: serviceData.description.trim() || '',
            price: parseFloat(serviceData.price),
            urlPicture: serviceData.urlPicture.trim() || undefined
          };

          setServices(prev => prev.map(s =>
            s.id === editingService.id ? updatedService : s
          ));
        }
      }

      setIsServiceModalVisible(false);
    } catch (error) {
      console.error('Error saving service:', error);
    }
  };

  // Handle product save
  const handleSaveProduct = async (productData: {
    name: string;
    description: string;
    price: string;
    urlPicture: string;
  }) => {
    try {
      if (isNewProduct) {
        // Create a new item (formerly product)
        const result = await client.models.Item.create({
          name: productData.name.trim(),
          description: productData.description.trim() || undefined,
          price: parseFloat(productData.price),
          businessID: businessId,
          categoryID: selectedServiceId || '', // Use selectedServiceId as categoryID
          imageUrl: productData.urlPicture.trim() || undefined, // Map urlPicture to imageUrl
          taxable: true // Default value
        });

        if (result.data) {
          // Convert to Product type for UI
          const newProduct = {
            id: result.data.id,
            name: result.data.name,
            description: result.data.description || '',
            price: result.data.price,
            businessID: result.data.businessID,
            serviceID: result.data.categoryID, // Use categoryID as serviceID
            urlPicture: result.data.imageUrl || '', // Map imageUrl to urlPicture
            imageUrl: result.data.imageUrl || '',
            sku: result.data.sku || '',
            taxable: result.data.taxable,
            createdAt: result.data.createdAt
          } as unknown as Product;

          setProducts(prev => [...prev, newProduct]);

          // Associate this new product with the currently selected service
          if (selectedServiceId) {
            setProductServiceMap(prev => ({
              ...prev,
              [newProduct.id]: selectedServiceId
            }));
          }
        }
      } else if (editingProduct) {
        // Update existing item
        const result = await client.models.Item.update({
          id: editingProduct.id,
          name: productData.name.trim(),
          description: productData.description.trim() || undefined,
          price: parseFloat(productData.price),
          categoryID: selectedServiceId || editingProduct.serviceID, // Use selectedServiceId as categoryID
          imageUrl: productData.urlPicture.trim() || undefined, // Map urlPicture to imageUrl
          businessID: businessId
        });

        if (result.data) {
          // Convert to Product type for UI
          const updatedProduct = {
            ...editingProduct,
            name: result.data.name,
            description: result.data.description || '',
            price: result.data.price,
            serviceID: result.data.categoryID, // Use categoryID as serviceID
            urlPicture: result.data.imageUrl || '', // Map imageUrl to urlPicture
            imageUrl: result.data.imageUrl || ''
          };

          setProducts(prev =>
            prev.map(p => p.id === editingProduct.id ? updatedProduct : p)
          );
        }
      }

      setIsProductModalVisible(false);
    } catch (error) {
      console.error('Error saving product:', error);
    }
  };

  // Delete service or product
  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;

    try {
      if (itemToDelete.type === 'service') {
        // Delete category (formerly service)
        await client.models.Category.delete({ id: itemToDelete.id });
        setServices(prev => prev.filter(s => s.id !== itemToDelete.id));

        // If the deleted service was selected, select another one
        if (selectedServiceId === itemToDelete.id) {
          const remainingServices = services.filter(s => s.id !== itemToDelete.id);
          setSelectedServiceId(remainingServices.length > 0 ? remainingServices[0].id : null);
        }

        // Remove mapping for products associated with this service
        const updatedMap = { ...productServiceMap };
        Object.keys(updatedMap).forEach(productId => {
          if (updatedMap[productId] === itemToDelete.id) {
            delete updatedMap[productId];
          }
        });
        setProductServiceMap(updatedMap);

      } else {
        // Delete item (formerly product)
        await client.models.Item.delete({ id: itemToDelete.id });
        const updatedProducts = products.filter(p => p.id !== itemToDelete.id);
        setProducts(updatedProducts);

        // Remove from service mapping
        const updatedMap = { ...productServiceMap };
        delete updatedMap[itemToDelete.id];
        setProductServiceMap(updatedMap);

        // Recalculate pagination
        setTotalPages(Math.ceil(updatedProducts.length / ITEMS_PER_PAGE));
        if (currentPage >= Math.ceil(updatedProducts.length / ITEMS_PER_PAGE)) {
          setCurrentPage(Math.max(0, Math.ceil(updatedProducts.length / ITEMS_PER_PAGE) - 1));
        }
      }

      setIsDeleteModalVisible(false);
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007aff" />
          <Text style={styles.loadingText}>Loading services and products...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        {/* Header with add buttons */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Product Management</Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.addButton, styles.serviceButton]}
              onPress={handleAddService}
            >
              <Text>+</Text>
              <Text style={styles.addButtonText}>Add Service</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.addButton, styles.productButton]}
              onPress={handleAddProduct}
            >
              <Text>+</Text>
              <Text style={styles.addButtonText}>Add Product</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Services and Products Content */}
        {services.length > 0 ? (
          <View style={{ flex: 1, marginTop: 0 }}>
            {/* Service tabs */}
            <View style={{ height: 24, marginBottom: 0 }}>
              <ServiceTabs
                services={services}
                selectedServiceId={selectedServiceId}
                onSelect={handleServiceSelect}
              />
            </View>

            {/* Service info card */}
            {selectedServiceId && (
              <View style={{ paddingVertical: 4, paddingHorizontal: 8, backgroundColor: 'white', borderRadius: 4, borderWidth: 1, borderColor: '#eee', marginVertical: 4 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    {services.find(s => s.id === selectedServiceId)?.urlPicture ? (
                      <Image
                        source={{ uri: services.find(s => s.id === selectedServiceId)?.urlPicture }}
                        style={{ width: 24, height: 24, borderRadius: 12, marginRight: 8 }}
                        resizeMode="cover"
                      />
                    ) : null}
                    <Text style={{ fontWeight: 'bold', fontSize: 14 }}>
                      {services.find(s => s.id === selectedServiceId)?.name}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      const service = services.find(s => s.id === selectedServiceId);
                      if (service) handleEditService(service);
                    }}
                    style={{ padding: 4 }}
                  >
                    <Text style={{ color: '#007aff', fontSize: 12 }}>Edit</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Products grid */}
            {paginatedProducts.length > 0 ? (
              <View style={{ flex: 1 }}>
                <FlatList
                  data={paginatedProducts}
                  renderItem={({ item }) => (
                    <ProductItem
                      item={item}
                      onEdit={handleEditProduct}
                      onDelete={(id) => handleDeletePrompt('product', id)}
                    />
                  )}
                  keyExtractor={item => item.id}
                  numColumns={2}
                  contentContainerStyle={{ paddingBottom: 20 }}
                />

                {/* Pagination controls */}
                {totalPages > 1 && (
                  <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 10 }}>
                    <TouchableOpacity
                      onPress={handlePrevPage}
                      disabled={currentPage === 0}
                      style={{ padding: 8, opacity: currentPage === 0 ? 0.5 : 1 }}
                    >
                      <Text>Previous</Text>
                    </TouchableOpacity>
                    <Text style={{ padding: 8 }}>
                      Page {currentPage + 1} of {totalPages}
                    </Text>
                    <TouchableOpacity
                      onPress={handleNextPage}
                      disabled={currentPage === totalPages - 1}
                      style={{ padding: 8, opacity: currentPage === totalPages - 1 ? 0.5 : 1 }}
                    >
                      <Text>Next</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ) : (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text>No products found for this service.</Text>
                <TouchableOpacity
                  style={{ marginTop: 10, padding: 10, backgroundColor: '#007aff', borderRadius: 5 }}
                  onPress={handleAddProduct}
                >
                  <Text style={{ color: 'white' }}>Add Product</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text>No services found. Add a service to get started.</Text>
            <TouchableOpacity
              style={{ marginTop: 10, padding: 10, backgroundColor: '#007aff', borderRadius: 5 }}
              onPress={handleAddService}
            >
              <Text style={{ color: 'white' }}>Add Service</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Service Modal */}
      <ServiceModal
        visible={isServiceModalVisible}
        onClose={() => setIsServiceModalVisible(false)}
        onSave={handleSaveService}
        service={editingService}
        isNewService={isNewService}
      />

      {/* Product Modal */}
      <ProductModal
        visible={isProductModalVisible}
        onClose={() => setIsProductModalVisible(false)}
        onSave={handleSaveProduct}
        product={editingProduct}
        isNewProduct={isNewProduct}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        visible={isDeleteModalVisible}
        onClose={() => setIsDeleteModalVisible(false)}
        onConfirm={handleDeleteConfirm}
        itemType={itemToDelete?.type || 'product'}
      />
    </View>
  );
};

export default ProductManagementScreen;