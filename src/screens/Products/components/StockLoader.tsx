// src/screens/Products/components/StockLoader.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, FlatList } from 'react-native';
import { loadStockService, loadAllStockData, DEFAULT_CATEGORIES } from '../../../../amplify/data/stockData';

interface StockLoaderProps {
  userId: string;
  onDataLoaded: () => void;
  createService: (data: any) => Promise<any>;
  createProduct: (data: any) => Promise<any>;
}

export default function StockLoader({ userId, onDataLoaded, createService, createProduct }: StockLoaderProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingCategory, setLoadingCategory] = useState<string | null>(null);
  
  const handleLoadCategory = async (categoryName: string) => {
    setIsLoading(true);
    setLoadingCategory(categoryName);
    
    try {
      await loadStockService(createService, createProduct, userId, categoryName);
      Alert.alert(
        "Success", 
        `Successfully loaded "${categoryName}" category and its products.`
      );
      onDataLoaded();
    } catch (error) {
      console.error(`Error loading category "${categoryName}":`, error);
      Alert.alert(
        "Error", 
        `Failed to load "${categoryName}" category. Please try again.`
      );
    } finally {
      setIsLoading(false);
      setLoadingCategory(null);
    }
  };
  
  const handleLoadAll = async () => {
    setIsLoading(true);
    
    try {
      await loadAllStockData(createService, createProduct, userId);
      Alert.alert(
        "Success", 
        "Successfully loaded all categories and products."
      );
      onDataLoaded();
    } catch (error) {
      console.error("Error loading all stock data:", error);
      Alert.alert(
        "Error", 
        "Failed to load all categories. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Load Predefined Services</Text>
      <Text style={styles.description}>
        Quickly add common dry cleaning services and products to get started.
      </Text>
      
      <FlatList
        data={DEFAULT_CATEGORIES}
        keyExtractor={(item) => item.name}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.categoryItem}
            onPress={() => handleLoadCategory(item.name)}
            disabled={isLoading}
          >
            <Text style={styles.categoryName}>{item.name}</Text>
            <Text style={styles.categoryDescription}>{item.description}</Text>
            {loadingCategory === item.name && (
              <ActivityIndicator size="small" color="#007AFF" style={styles.loader} />
            )}
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.listContent}
      />
      
      <TouchableOpacity
        style={[styles.loadAllButton, isLoading && styles.disabledButton]}
        onPress={handleLoadAll}
        disabled={isLoading}
      >
        {isLoading && !loadingCategory ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonText}>Load All Services</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 16,
    margin: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    color: '#666',
    marginBottom: 16,
  },
  listContent: {
    paddingBottom: 8,
  },
  categoryItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  categoryDescription: {
    fontSize: 14,
    color: '#666',
    flex: 2,
  },
  loader: {
    marginLeft: 8,
  },
  loadAllButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  disabledButton: {
    backgroundColor: '#999',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});