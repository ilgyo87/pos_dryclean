// src/screens/Categories/ProductsScreen.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Alert 
} from 'react-native';
import { useAuthenticator } from '@aws-amplify/ui-react-native';
import CategoryTabs from '../Products/CategoryTabs';
import ProductList from '../Products/ProductList';
import DefaultServicesButton from '../Products/DefaultServicesButton';

// Define types
interface Category {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  image?: string;
  description?: string;
  categoryId: string;
}

// Mock data for demo purposes
const mockCategories: Category[] = [
  { id: '1', name: 'Shirts' },
  { id: '2', name: 'Pants' },
  { id: '3', name: 'Dresses' },
  { id: '4', name: 'Suits' },
  { id: '5', name: 'Coats' }
];

const mockProducts: Product[] = [
  { id: '1', name: 'Dress Shirt', price: 4.99, categoryId: '1', image: 'dress_shirt' },
  { id: '2', name: 'T-Shirt', price: 3.99, categoryId: '1', image: 'tshirt' },
  { id: '3', name: 'Polo', price: 4.49, categoryId: '1', image: 'polo' },
  { id: '4', name: 'Jeans', price: 6.99, categoryId: '2', image: 'jeans' },
  { id: '5', name: 'Slacks', price: 6.49, categoryId: '2', image: 'slacks' },
  { id: '6', name: 'Khakis', price: 5.99, categoryId: '2', image: 'khakis' },
  { id: '7', name: 'Cocktail Dress', price: 14.99, categoryId: '3', image: 'cocktail_dress' },
  { id: '8', name: 'Evening Gown', price: 18.99, categoryId: '3', image: 'evening_gown' },
  { id: '9', name: 'Business Suit', price: 19.99, categoryId: '4', image: 'business_suit' },
  { id: '10', name: 'Tuxedo', price: 24.99, categoryId: '4', image: 'tuxedo' },
  { id: '11', name: 'Winter Coat', price: 16.99, categoryId: '5', image: 'winter_coat' },
  { id: '12', name: 'Rain Coat', price: 12.99, categoryId: '5', image: 'rain_coat' }
];

const ProductsScreen: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>(mockCategories);
  const [products, setProducts] = useState<Product[]>([]);
  const { user } = useAuthenticator((context) => [context.user]);

  useEffect(() => {
    // Set the first category as selected when component mounts
    if (categories.length > 0 && !selectedCategory) {
      setSelectedCategory(categories[0].id);
    }
  }, [categories, selectedCategory]);

  useEffect(() => {
    // Filter products based on the selected category
    if (selectedCategory) {
      setProducts(mockProducts.filter(product => product.categoryId === selectedCategory));
    } else {
      setProducts([]);
    }
  }, [selectedCategory]);

  const handleAddDefaultServices = () => {
    // Placeholder for future implementation
    Alert.alert("Success", "Default services added successfully!");
  };

  const handleAddCategory = () => {
    Alert.alert("Add Category", "This feature will be implemented soon!");
  };

  const handleAddProduct = () => {
    Alert.alert("Add Product", "This feature will be implemented soon!");
  };

  const handleEditProduct = (product: Product) => {
    Alert.alert("Edit Product", `Editing ${product.name} (ID: ${product.id})`);
  };

  return (
    <View style={styles.container}>
      {/* Categories Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Services</Text>
        <DefaultServicesButton onPress={handleAddDefaultServices} />
      </View>

      {/* Categories Tabs */}
      <CategoryTabs 
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        onAddCategory={handleAddCategory}
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
            <TouchableOpacity 
              style={styles.emptyStateButton}
              onPress={handleAddDefaultServices}
            >
              <Text style={styles.emptyStateButtonText}>Add Default Services</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ProductList
            products={products}
            categoryName={selectedCategory 
              ? categories.find(c => c.id === selectedCategory)?.name || ""
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