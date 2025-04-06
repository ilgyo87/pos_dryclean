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
import ServiceModal from '../components/ServiceModal';
import ProductModal from '../components/ProductModal';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';
import ProductItem from '../components/ProductItem';

// Import types
import { Category, Product, RouteParams } from '../types/productTypes';
import { Alert } from 'react-native';
import CategoryTabs from '../components/ServiceTabs';

// Initialize Amplify client
const client = generateClient<Schema>();

const ProductManagementScreen: React.FC = () => {
  const route = useRoute();
  const { businessId } = route.params as RouteParams;

  // State for categories and products
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Client-side mapping of products to categories
  const [productCategoryMap, setProductCategoryMap] = useState<Record<string, string>>({});

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
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [itemToDelete, setItemToDelete] = useState<{ type: 'category' | 'product', id: string } | null>(null);
  const ITEMS_PER_PAGE = 12;

  // Fetch categories and products from the database
  const fetchCategoriesAndProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      console.log('Fetching categories and products...');

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

      // Convert category data to Category type
      const allCategories: Category[] = categoriesResult.data ? categoriesResult.data.map(category => ({
        id: category.id,
        name: category.name,
        description: category.description || '',
        price: 0,
        imageUrl: category.imageUrl || undefined,
        businessID: category.businessID,
        products: [],
        createdAt: category.createdAt,
        estimatedTime: 0,
      })) : [];

      // Convert item data to Product type
      const allProducts = itemsResult.data ? itemsResult.data.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description || '',
        price: item.price,
        sku: item.sku || '',
        imageUrl: item.imageUrl || undefined,
        urlPicture: item.imageUrl || undefined,
        taxable: item.taxable || false,
        businessID: item.businessID,
        categoryID: item.categoryID,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      })) : [];

      // Sort categories alphabetically
      const sortedCategories = [...allCategories].sort((a, b) => a.name.localeCompare(b.name));

      setCategories(sortedCategories);
      setProducts(allProducts);

      // Select the first category by default if we don't have one selected
      if (sortedCategories.length > 0 && !selectedCategoryId) {
        setSelectedCategoryId(sortedCategories[0].id);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to load categories and products');
    } finally {
      setIsLoading(false);
    }
  }, [businessId]);

  // Fetch data on component mount and when refreshKey changes
  useEffect(() => {
    fetchCategoriesAndProducts();
  }, [fetchCategoriesAndProducts, refreshKey]);

  // Handle category selection
  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    // We don't need to reset currentPage here, it's handled in the useEffect for filtered products
  };

  // Filter products by the selected category
  const filteredProducts = useMemo(() => {
    console.log('Filtering products for category ID:', selectedCategoryId);
    console.log('Total products before filtering:', products.length);

    if (!selectedCategoryId) {
      console.log('No selected category ID, returning all products');
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

    // Filter by category ID first, then sort
    const filtered = products.filter(product => product.categoryID === selectedCategoryId);

    // Sort filtered products by createdAt
    return filtered.sort((a, b) => {
      if (a.createdAt && b.createdAt) {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (a.createdAt) return -1;
      if (b.createdAt) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [products, selectedCategoryId]);

  // Update pagination when filtered products change
  useEffect(() => {
    setTotalPages(Math.ceil(filteredProducts.length / ITEMS_PER_PAGE));
    setCurrentPage(0); // Reset to first page when changing categories
  }, [filteredProducts, ITEMS_PER_PAGE]);
  // Calculate paginated products based on filtered products
  const paginatedProducts = useMemo(() => {
    const startIndex = currentPage * ITEMS_PER_PAGE;
    return filteredProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage, ITEMS_PER_PAGE]);

  useEffect(() => {
    // Only reset page when category changes
    if (selectedCategoryId) {
      setCurrentPage(0);
    }
  }, [selectedCategoryId]);

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

  // Open category modal for adding a new category
  const handleAddCategory = () => {
    setIsNewService(true);
    setEditingCategory(null);
    setIsServiceModalVisible(true);
  };

  // Open category modal for editing an existing category
  const handleEditCategory = (category: Category) => {
    setIsNewService(false);
    setEditingCategory(category);
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
  const handleDeletePrompt = (type: 'category' | 'product', id: string) => {
    setItemToDelete({ type, id });
    setIsDeleteModalVisible(true);
  };

  // Handle category save
  const handleSaveCategory = async (categoryData: {
    name: string;
    description: string;
    price: string;
    urlPicture: string;
  }) => {
    try {
      if (isNewService) {
        // Create new category (formerly service)
        const result = await client.models.Category.create({
          name: categoryData.name.trim(),
          description: categoryData.description.trim() || undefined,
          businessID: businessId
          // Note: price and urlPicture are not part of Category model
        });

        if (result.data) {
          // Convert to Category type for UI
          const newService = {
            id: result.data.id,
            name: result.data.name,
            description: result.data.description || '',
            businessID: result.data.businessID,
            price: parseFloat(categoryData.price), // Store locally only
            urlPicture: categoryData.urlPicture.trim() || undefined // Store locally only
          } as unknown as Category;

          setCategories(prev => [...prev, newService]);
          setSelectedCategoryId(result.data.id);
        }
      } else if (editingCategory) {
        // Update existing category
        const result = await client.models.Category.update({
          id: editingCategory.id,
          name: categoryData.name.trim(),
          description: categoryData.description.trim() || undefined,
          // Note: price and urlPicture are not updated in the database
        });

        if (result.data) {
          // Update local state with all fields including UI-only ones
          const updatedService = {
            ...editingCategory,
            name: categoryData.name.trim(),
            description: categoryData.description.trim() || '',
            price: parseFloat(categoryData.price),
            urlPicture: categoryData.urlPicture.trim() || undefined
          } as unknown as Category;

          setCategories(prev => prev.map(s =>
            s.id === editingCategory.id ? updatedService : s
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
          categoryID: selectedCategoryId || '', // Use selectedCategoryId as categoryID
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
            categoryID: result.data.categoryID, // Use categoryID as categoryID
            imageUrl: result.data.imageUrl || '',
            sku: result.data.sku || '',
            taxable: result.data.taxable,
            createdAt: result.data.createdAt,
            updatedAt: result.data.updatedAt
          } as unknown as Product;

          setProducts(prev => [...prev, newProduct]);

          // Associate this new product with the currently selected category
          if (selectedCategoryId) {
            setProductCategoryMap(prev => ({
              ...prev,
              [newProduct.id]: selectedCategoryId
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
          categoryID: selectedCategoryId || editingProduct.categoryID, // Use selectedCategoryId as categoryID
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
            categoryID: result.data.categoryID, // Use categoryID as categoryID
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
      if (itemToDelete.type === 'category') {
        // Delete category (formerly service)
        await client.models.Category.delete({ id: itemToDelete.id });
        setCategories(prev => prev.filter(s => s.id !== itemToDelete.id));

        // If the deleted category was selected, select another one
        if (selectedCategoryId === itemToDelete.id) {
          const remainingCategories = categories.filter(s => s.id !== itemToDelete.id);
          setSelectedCategoryId(remainingCategories.length > 0 ? remainingCategories[0].id : null);
        }

        // Remove mapping for products associated with this category
        const updatedMap = { ...productCategoryMap };
        Object.keys(updatedMap).forEach(productId => {
          if (updatedMap[productId] === itemToDelete.id) {
            delete updatedMap[productId];
          }
        });
        setProductCategoryMap(updatedMap);

      } else {
        // Delete item (formerly product)
        await client.models.Item.delete({ id: itemToDelete.id });
        const updatedProducts = products.filter(p => p.id !== itemToDelete.id);
        setProducts(updatedProducts);

        // Remove from category mapping
        const updatedMap = { ...productCategoryMap };
        delete updatedMap[itemToDelete.id];
        setProductCategoryMap(updatedMap);

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
          <Text style={styles.loadingText}>Loading categories and products...</Text>
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
              onPress={handleAddCategory}
            >
              <Text>+</Text>
              <Text style={styles.addButtonText}>Add Category</Text>
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
        {categories.length > 0 ? (
          <View style={{ flex: 1, marginTop: 0 }}>
            {/* Category tabs */}
            <View style={{ height: 24, marginBottom: 0 }}>
              <CategoryTabs
                categories={categories}
                selectedCategoryId={selectedCategoryId}
                onSelect={handleCategorySelect}
              />
            </View>

            {/* Category info card */}
            {selectedCategoryId && (
              <View style={{ paddingVertical: 4, paddingHorizontal: 8, backgroundColor: 'white', borderRadius: 4, borderWidth: 1, borderColor: '#eee', marginVertical: 4 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    {categories.find(s => s.id === selectedCategoryId)?.imageUrl ? (
                      <Image
                        source={{ uri: categories.find(s => s.id === selectedCategoryId)?.imageUrl }}
                        style={{ width: 24, height: 24, borderRadius: 12, marginRight: 8 }}
                        resizeMode="cover"
                      />
                    ) : null}
                    <Text style={{ fontWeight: 'bold', fontSize: 14 }}>
                      {categories.find(s => s.id === selectedCategoryId)?.name}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      const category = categories.find(s => s.id === selectedCategoryId);
                      if (category) handleEditCategory(category);
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
              <View style={{ flex: 1, backgroundColor: 'white' }}>
                <View style={[ styles.gridContainer ]}>
                  {paginatedProducts.map((item, index) => (
                    <View key={item.id} style={ styles.gridItem }>
                      <ProductItem
                        item={item}
                        onEdit={handleEditProduct}
                        onDelete={(id) => handleDeletePrompt('product', id)}
                      />
                    </View>
                  ))}
                </View>

                {/* Pagination controls */}
                {totalPages > 1 && (
                  <View style={{
                    flexDirection: 'row',
                    justifyContent: 'center',
                    marginTop: 0, // Remove top margin
                    height: 30,   // Make even smaller
                    position: 'absolute', // Position at bottom
                    bottom: 0,    // Position at bottom
                    left: 0,
                    right: 0,
                  }}>
                    <TouchableOpacity
                      onPress={handlePrevPage}
                      disabled={currentPage === 0}
                      style={{
                        padding: 4, // Reduced from 8
                        opacity: currentPage === 0 ? 0.5 : 1
                      }}
                    >
                      <Text>←</Text>
                    </TouchableOpacity>
                    <Text style={{ padding: 4 }}>{currentPage + 1}/{totalPages}</Text>
                    <TouchableOpacity
                      onPress={handleNextPage}
                      disabled={currentPage === totalPages - 1}
                      style={{
                        padding: 4, // Reduced from 8
                        opacity: currentPage === totalPages - 1 ? 0.5 : 1
                      }}
                    >
                      <Text>→</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ) : (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text>No products found for this category.</Text>
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
            <Text>No categories found. Add a category to get started.</Text>
            <TouchableOpacity
              style={{ marginTop: 10, padding: 10, backgroundColor: '#007aff', borderRadius: 5 }}
              onPress={handleAddCategory}
            >
              <Text style={{ color: 'white' }}>Add Category</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Service Modal */}
      <ServiceModal
        visible={isServiceModalVisible}
        onClose={() => setIsServiceModalVisible(false)}
        onSave={handleSaveCategory}
        service={editingCategory}
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
        itemType={itemToDelete?.type || 'category'}
      />
    </View>
  );
};

export default ProductManagementScreen;