// src/screens/Categories/Products/ProductsScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import CategoryTabs from './CategoryTabs';
import ProductList from './ProductList';
import DefaultServicesButton from './DefaultServicesButton';
import CategoryForm from './CategoryForm';
import ProductForm from './ProductForm';
import { useCategories } from '../../../hooks/useCategories';
import { useProducts } from '../../../hooks/useProducts';
import type { Category, Product } from '../../../types';

interface ProductsScreenProps {
  business?: any;
  businessId?: string;
  employeeId?: string;
  firstName?: string;
  lastName?: string;
  route?: any;
  navigation?: any;
}

const ProductsScreen: React.FC<ProductsScreenProps> = (props) => {
  console.log('[ProductsScreen] props:', props);
  
  // Get businessId from props or route params
  const businessId = props.businessId || (props.route?.params?.businessId);
  
  console.log('[ProductsScreen] Using businessId:', businessId);
  
  // Defensive UI if businessId is missing
  if (!businessId) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: 'red', fontSize: 16, textAlign: 'center', margin: 20 }}>
          No business found. Please create or select a business from the dashboard.
        </Text>
      </View>
    );
  }
  
  const { categories, loading: loadingCategories, fetchCategories } = useCategories();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Only fetch products for the selected category
  const { 
    products, 
    loading: loadingProducts, 
    fetchProducts,
    createProduct, 
    editProduct, 
    removeProduct 
  } = useProducts(businessId, selectedCategory || undefined);

  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  console.log('[ProductsScreen] Selected category:', selectedCategory);
  console.log('[ProductsScreen] Categories count:', categories.length);
  console.log('[ProductsScreen] Products count:', products.length);

  // Initial fetch of categories
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Select the first category if none is selected and categories exist
  useEffect(() => {
    if (
      categories.length > 0 &&
      (!selectedCategory || !categories.find(c => c._id === selectedCategory))
    ) {
      console.log('[ProductsScreen] Setting initial category to:', categories[0]._id);
      setSelectedCategory(categories[0]._id);
    }
  }, [categories, selectedCategory]);

  // Fetch products when selected category changes
  useEffect(() => {
    if (selectedCategory) {
      console.log('[ProductsScreen] Fetching products for category:', selectedCategory);
      fetchProducts();
    }
  }, [selectedCategory, fetchProducts, refreshTrigger]);

  // Helper to refresh all data
  const refreshData = useCallback(() => {
    console.log('[ProductsScreen] Refreshing all data');
    fetchCategories();
    setRefreshTrigger(prev => prev + 1); // This will trigger a product refetch via useEffect
  }, [fetchCategories]);

  // CATEGORY HANDLERS
  const handleAddCategory = () => {
    setEditingCategory(null);
    setShowCategoryForm(true);
  };
  
  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setShowCategoryForm(true);
  };
  
  const handleCategoryFormSuccess = (cat?: Category) => {
    setShowCategoryForm(false);
    fetchCategories();
    if (cat && (!selectedCategory || selectedCategory !== cat._id)) {
      setSelectedCategory(cat._id);
    }
  };

  // PRODUCT HANDLERS
  const handleAddProduct = () => {
    setEditingProduct(null);
    setShowProductForm(true);
  };
  
  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setShowProductForm(true);
  };
  
  const handleProductFormSuccess = () => {
    setShowProductForm(false);
    fetchProducts(); // Refetch products for the current category
  };

  // Get category name for selected category
  const selectedCategoryName = selectedCategory
    ? categories.find(c => c._id === selectedCategory)?.name || ""
    : "";

  return (
    <View style={styles.container}>
      {/* Category Modal */}
      <CategoryForm
        visible={showCategoryForm}
        onClose={() => setShowCategoryForm(false)}
        onSuccess={handleCategoryFormSuccess}
        category={editingCategory}
        businessId={businessId}
      />
      
      {/* Product Modal */}
      <ProductForm
        visible={showProductForm}
        onClose={() => setShowProductForm(false)}
        onSuccess={handleProductFormSuccess}
        product={editingProduct}
        categories={categories}
        businessId={businessId}
      />
      
      {/* Categories Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Services</Text>
      </View>

      {/* Categories Tabs */}
      <CategoryTabs 
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        onAddCategory={handleAddCategory}
        onEditCategory={handleEditCategory}
      />

      {/* Products Content Area */}
      <View style={styles.contentArea}>
        {categories.length === 0 ? (
          <View style={styles.emptyStateContainer}>
            <Text style={styles.emptyStateTitle}>No Services Found</Text>
            <Text style={styles.emptyStateText}>
              You don't have any services set up yet. You can add services manually or use our
              predefined templates for common dry cleaning services.
            </Text>

            <DefaultServicesButton 
              businessId={businessId}
              onComplete={refreshData}
            />
          </View>
        ) : (
          <ProductList
            products={products}
            categoryName={selectedCategoryName}
            onAddProduct={handleAddProduct}
            onEditProduct={handleEditProduct}
            loading={loadingProducts}
          />
        )}
      </View>
      
      {/* Loading and Debug Info (you can remove this in production) */}
      {(loadingCategories || loadingProducts) && (
        <View style={styles.loadingInfo}>
          <Text style={styles.loadingText}>
            {loadingCategories ? 'Loading categories...' : 'Loading products...'}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  contentArea: {
    flex: 1,
    padding: 16,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 8,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
  },
  loadingInfo: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 8,
    borderRadius: 5,
  },
  loadingText: {
    color: 'white',
    fontSize: 12,
  },
});

export default ProductsScreen;