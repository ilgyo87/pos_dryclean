// src/screens/Checkout/ProductGrid.tsx
// Update the ProductGrid component props interface

import React from 'react';
import { View, FlatList, TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Product } from '../../types';

// Update the props interface to include onAddItem
export interface ProductGridProps {
  products: Product[];
  loading: boolean;
  onAddItem: (product: Product) => void;
}

const ProductGrid: React.FC<ProductGridProps> = ({ products, loading, onAddItem }) => {
  // Your existing component implementation
  
  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Loading products...</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.productItem}
              onPress={() => onAddItem(item)}
            >
              <Text style={styles.productName}>{item.name}</Text>
              <Text style={styles.productPrice}>${item.price?.toFixed(2)}</Text>
            </TouchableOpacity>
          )}
          keyExtractor={item => item._id}
          numColumns={3}
          contentContainerStyle={styles.productGrid}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No products in this category</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  productGrid: {
    padding: 10,
  },
  productItem: {
    flex: 1,
    margin: 5,
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
    maxWidth: '33%',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  productName: {
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
  },
  productPrice: {
    color: '#4CAF50',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
  },
});

export default ProductGrid;
