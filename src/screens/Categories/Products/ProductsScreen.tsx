// src/screens/Categories/ProductsScreen.tsx
import React, { useState, useEffect } from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react-native';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Alert 
} from 'react-native';

import CategoryTabs from '../Products/CategoryTabs';
import ProductList from '../Products/ProductList';
import DefaultServicesButton from '../Products/DefaultServicesButton';
import { useBusiness } from '../../../hooks/useBusiness';
import CategoryForm from '../Products/CategoryForm';
import ProductForm from '../Products/ProductForm';
import { useCategories } from '../../../hooks/useCategories';
import { useProducts } from '../../../hooks/useProducts';
import type { Category, Product } from '../../../types';



import type { Business } from '../../../types';

interface ProductsScreenProps {
  business?: Business;
  employeeId?: string;
  firstName?: string;
  lastName?: string;
}

const ProductsScreen: React.FC<ProductsScreenProps> = ({ business, employeeId, firstName, lastName }) => {
  console.log('[ProductsScreen] Received business:', business);
  const { categories, loading: loadingCategories, createCategory, editCategory, removeCategory, fetchCategories } = useCategories();
  const { products, loading: loadingProducts, createProduct, editProduct, removeProduct, fetchProducts } = useProducts();


  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  useEffect(() => {
    if (
      categories.length > 0 &&
      (!selectedCategory || !categories.find(c => c._id === selectedCategory))
    ) {
      setSelectedCategory(categories[0]._id);
    }
  }, [categories]);

  const filteredProducts = selectedCategory
    ? products.filter(product => product.categoryId === selectedCategory)
    : [];

  const handleAddDefaultServices = () => {
    // Placeholder for future implementation
    Alert.alert("Success", "Default services added successfully!");
  };

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
    if (cat && !selectedCategory) setSelectedCategory(cat._id);
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
    fetchProducts();
  };

  return (
    <View style={styles.container}>
      {/* Category Modal */}
      <CategoryForm
        visible={showCategoryForm}
        onClose={() => setShowCategoryForm(false)}
        onSuccess={handleCategoryFormSuccess}
        category={editingCategory}
      />
      {/* Product Modal */}
      <ProductForm
        visible={showProductForm}
        onClose={() => setShowProductForm(false)}
        onSuccess={handleProductFormSuccess}
        product={editingProduct}
        categories={categories}
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
              businessId={business?._id}
              onComplete={async () => {
                await fetchCategories();
                await fetchProducts();
              }}
            />
          </View>
        ) : (
          <ProductList
            products={filteredProducts}
            categoryName={selectedCategory 
              ? categories.find(c => c._id === selectedCategory)?.name || ""
              : ""}
            onAddProduct={handleAddProduct}
            onEditProduct={handleEditProduct}
          />
        )}
      </View>
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
  emptyStateButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
  },
  emptyStateButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default ProductsScreen;