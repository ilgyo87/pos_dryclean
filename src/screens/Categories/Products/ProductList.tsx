// src/screens/Categories/Products/ProductList.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { getGarmentImage } from '../../../utils/ImageMapping';
import type { Product } from '../../../types';

interface ProductListProps {
  products: Product[];
  categoryName: string;
  onAddProduct: () => void;
  onEditProduct: (product: Product) => void;
  loading?: boolean;
}

const ProductList: React.FC<ProductListProps> = ({
  products,
  categoryName,
  onAddProduct,
  onEditProduct,
  loading = false
}) => {
  // Debug log
  console.log(`[ProductList] Rendering ${products.length} products for ${categoryName}`);
  
  // Log first few products for debugging (if any)
  if (products.length > 0) {
    console.log('[ProductList] First product sample:', products[0]);
  }

  const renderProductItem = ({ item }: { item: Product }) => {
    console.log(`[ProductList] Rendering product: ${item.name}, ID: ${item._id}`);
    
    return (
      <TouchableOpacity 
        style={styles.productItem}
        onPress={() => onEditProduct(item)}
        key={item._id}
      >
        <View style={styles.productImageContainer}>
          {item.imageName ? (
            <Image
              source={getGarmentImage(item.imageName)}
              style={{ width: 40, height: 40 }}
              resizeMode="contain"
            />
          ) : (
            <Image
              source={getGarmentImage('default')}
              style={{ width: 40, height: 40 }}
              resizeMode="contain"
            />
          )}
        </View>
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{item.name}</Text>
          <Text style={styles.productPrice}>
            {item.price !== undefined ? `$${item.price.toFixed(2)}` : 'N/A'}
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => onEditProduct(item)}
        >
          <MaterialIcons name="edit" size={18} color="#666" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.productsContainer}>
      <View style={styles.productsHeader}>
        <Text style={styles.productsTitle}>
          {categoryName} Products
        </Text>
        <TouchableOpacity 
          style={styles.addProductButton}
          onPress={onAddProduct}
        >
          <MaterialIcons name="add" size={16} color="#fff" />
          <Text style={styles.addProductText}>Add Product</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text style={styles.loadingText}>Loading products...</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          renderItem={renderProductItem}
          keyExtractor={item => item._id}
          contentContainerStyle={[
            styles.productsList,
            products.length === 0 && styles.emptyList
          ]}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No products in this category</Text>
              <Text style={styles.emptySubtext}>
                Click "Add Product" to create a new product
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  productsContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  productsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  productsTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  addProductButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007bff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addProductText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 14,
    marginLeft: 4,
  },
  productsList: {
    padding: 12,
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  productImageContainer: {
    width: 50,
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
    backgroundColor: '#f9f9f9',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 14,
    color: '#666',
  },
  editButton: {
    padding: 10,
  },
  emptyContainer: {
    padding: 30,
    alignItems: 'center',
  },
  emptyText: {
    color: '#888',
    fontWeight: '500',
    fontSize: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    color: '#aaa',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
});

export default ProductList;