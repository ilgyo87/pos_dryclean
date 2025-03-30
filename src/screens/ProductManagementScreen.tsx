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

// Initialize Amplify client
const client = generateClient<Schema>();

// Define 4x4 grid = 16 items per page
const ITEMS_PER_PAGE = 16;

const ProductManagementScreen: React.FC = () => {
  const route = useRoute();
  const { businessId } = route.params as RouteParams;

  // State for services and products
  const [services, setServices] = useState<Service[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

      // Initialize product to service mapping if empty
      if (Object.keys(productServiceMap).length === 0 && allProducts.length > 0 && servicesResult.data) {
        const servicesData = servicesResult.data as unknown as Service[];
        if (servicesData.length > 0) {
          // Create a map of product ID to service ID
          const initialMap: Record<string, string> = {};
          allProducts.forEach((product, index) => {
            // Distribute products evenly among services
            const serviceIndex = index % servicesData.length;
            initialMap[product.id] = servicesData[serviceIndex].id;
          });
          setProductServiceMap(initialMap);
        }
      }

      // Calculate total pages for pagination
      setTotalPages(Math.ceil(allProducts.length / ITEMS_PER_PAGE));
    } catch (error) {
      console.error('Error fetching services and products:', error);
    } finally {
      setIsLoading(false);
    }
  }, [businessId, selectedServiceId]);

  useEffect(() => {
    fetchServicesAndProducts();
  }, [fetchServicesAndProducts]);

  // Handle service tab selection without refreshing all data
  const handleServiceSelect = (serviceId: string) => {
    setSelectedServiceId(serviceId);
    setCurrentPage(0); // Reset to first page when switching services
  };

  // Filter products by the selected service
  const filteredProducts = useMemo(() => {
    if (!selectedServiceId) return products;
    return products.filter(product => productServiceMap[product.id] === selectedServiceId);
  }, [products, selectedServiceId, productServiceMap]);

  // Update pagination when filtered products change
  useEffect(() => {
    setTotalPages(Math.ceil(filteredProducts.length / ITEMS_PER_PAGE));
    // Reset to first page if current page is out of bounds
    if (currentPage >= Math.ceil(filteredProducts.length / ITEMS_PER_PAGE)) {
      setCurrentPage(0);
    }
  }, [filteredProducts.length, currentPage]);

  // Get paginated products from filtered products
  const getPaginatedProducts = () => {
    const startIndex = currentPage * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredProducts.slice(startIndex, endIndex);
  };

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
        // Create new service
        const result = await client.models.Service.create({
          name: serviceData.name.trim(),
          description: serviceData.description.trim() || undefined,
          price: parseFloat(serviceData.price),
          businessID: businessId,
          urlPicture: serviceData.urlPicture.trim() || undefined
        });

        if (result.data) {
          setServices(prev => [...prev, result.data as unknown as Service]);
          setSelectedServiceId(result.data.id);
        }
      } else if (editingService) {
        // Update existing service
        const result = await client.models.Service.update({
          id: editingService.id,
          name: serviceData.name.trim(),
          description: serviceData.description.trim() || undefined,
          price: parseFloat(serviceData.price),
          urlPicture: serviceData.urlPicture.trim() || undefined,
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
        // Create a new product
        const result = await client.models.Product.create({
          name: productData.name.trim(),
          description: productData.description.trim() || undefined,
          price: parseFloat(productData.price),
          businessID: businessId,
          serviceID: selectedServiceId || '',
          urlPicture: productData.urlPicture.trim() || undefined
        });

        if (result.data) {
          const newProduct = result.data as unknown as Product;
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
        // Update existing product
        const result = await client.models.Product.update({
          id: editingProduct.id,
          name: productData.name.trim(),
          description: productData.description.trim() || undefined,
          price: parseFloat(productData.price),
          serviceID: selectedServiceId || editingProduct.serviceID,
          urlPicture: productData.urlPicture.trim() || undefined,
          businessID: businessId
        });

        if (result.data) {
          setProducts(prev =>
            prev.map(p => p.id === editingProduct.id ? result.data as unknown as Product : p)
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
        // Delete service
        await client.models.Service.delete({ id: itemToDelete.id });
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
        // Delete product
        await client.models.Product.delete({ id: itemToDelete.id });
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
                    <Text style={{ fontSize: 14, fontWeight: 'bold' }}>{services.find(s => s.id === selectedServiceId)?.name}</Text>
                  </View>
                  <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#4CAF50' }}>${services.find(s => s.id === selectedServiceId)?.price.toFixed(2)}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
                  <Text style={{ fontSize: 12, color: '#666' }} numberOfLines={1}>
                    {services.find(s => s.id === selectedServiceId)?.description || 'No description'}
                  </Text>
                  <TouchableOpacity onPress={() => {
                    const service = services.find(s => s.id === selectedServiceId);
                    if (service) handleEditService(service);
                  }}>
                    <Text style={{ fontSize: 12, color: '#1890ff' }}>Edit</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Products grid */}
            <View style={{ flex: 1 }}>
              <FlatList
                data={getPaginatedProducts()}
                renderItem={(props) => <ProductItem
                  {...props}
                  onEdit={handleEditProduct}
                  onDelete={(id) => handleDeletePrompt('product', id)}
                />}
                keyExtractor={(item) => item.id}
                numColumns={4}
                key="four-column"
                columnWrapperStyle={{ justifyContent: 'flex-start' }}
                contentContainerStyle={{ paddingBottom: 8 }}
              />

              {/* Pagination controls - only show if more than 16 items */}
              {totalPages > 1 && (
                <View style={styles.paginationContainer}>
                  <TouchableOpacity
                    style={[
                      styles.paginationButton,
                      currentPage === 0 && styles.paginationButtonDisabled
                    ]}
                    onPress={handlePrevPage}
                    disabled={currentPage === 0}
                  >
                    <Text>←</Text>
                  </TouchableOpacity>

                  <Text style={styles.paginationText}>
                    Page {currentPage + 1} of {totalPages}
                  </Text>

                  <TouchableOpacity
                    style={[
                      styles.paginationButton,
                      currentPage === totalPages - 1 && styles.paginationButtonDisabled
                    ]}
                    onPress={handleNextPage}
                    disabled={currentPage === totalPages - 1}
                  >
                    <Text>→</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        ) : (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>No services found. Add a service to get started.</Text>
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
        itemType={itemToDelete?.type || 'item'}
      />
    </View>
  );
};

export default ProductManagementScreen;