import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import type { Schema } from './../../../../amplify/data/resource';

interface ProductListProps {
  products: Schema["Item"]["type"][];
  selectedService: string | null;
  onAddProduct: () => void; // Placeholder for add functionality
}

const ProductList: React.FC<ProductListProps> = ({
  products,
  selectedService,
  onAddProduct,
}) => {
  return (
    <View style={styles.productsContainer}>
      <View style={styles.productsHeader}>
        <Text style={styles.sectionTitle}>Products</Text>
        {selectedService && (
          <TouchableOpacity style={styles.addButton} onPress={onAddProduct}>
            <Text style={styles.buttonText}>Add Product</Text>
          </TouchableOpacity>
        )}
      </View>
      
      <FlatList
        data={products}
        renderItem={({ item }) => (
          <View style={styles.productItem}>
            <Text style={styles.productName}>{item.name}</Text>
            <Text style={styles.productPrice}>${item.price?.toFixed(2) || "0.00"}</Text>
          </View>
        )}
        keyExtractor={item => item.id}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {selectedService ? "No products found for this service" : "Select a service to view products"}
          </Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  productsContainer: {
    flex: 1,
    padding: 12,
  },
  productsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: '#34C759', // Kept green for Add Product
    paddingVertical: 6, // Adjusted padding
    paddingHorizontal: 12, // Adjusted padding
    borderRadius: 6,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14, // Adjusted font size
  },
  productItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  productName: {
    fontSize: 16,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 32,
    color: '#888',
    fontSize: 16,
  }
});

export default ProductList;
