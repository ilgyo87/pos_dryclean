// src/screens/Products/components/StockLoader.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DEFAULT_CATEGORIES } from '../../../../amplify/data/stockData';
import { useAppDispatch } from '../../../store/hooks';
import { createCategory } from '../../../store/slices/CategorySlice';
import { createItem } from '../../../store/slices/ItemSlice';

interface StockLoaderProps {
  userId: string;
  onDataLoaded: () => void;
  createService?: (data: any) => Promise<any[]>;
  createProduct?: () => Promise<null>;
}

export default function StockLoader({ 
  userId, 
  onDataLoaded,
  createService,
  createProduct
}: StockLoaderProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingCategory, setLoadingCategory] = useState<string | null>(null);
  const dispatch = useAppDispatch();
  
  const handleLoadCategory = async (categoryName: string) => {
    if (!userId) {
      Alert.alert("Error", "User ID is missing. Please log in again.");
      return;
    }
    
    setIsLoading(true);
    setLoadingCategory(categoryName);
    
    try {
      // Find the category data in the default stock data
      const categoryData = DEFAULT_CATEGORIES.find(c => c.name === categoryName);
      if (!categoryData) {
        throw new Error(`Service "${categoryName}" not found in stock data`);
      }
      
      // Create the category using Redux
      const categoryAction = await dispatch(createCategory({
        categoryData: {
          ...categoryData,
          userId
        },
        userId
      })).unwrap();
      
      // If successful, add all the products for this category
      if (categoryAction && categoryAction.id) {
        const categoryId = categoryAction.id;
        
        // Get the items for this category
        const items = DEFAULT_ITEMS[categoryName];
        if (items && items.length > 0) {
          // For each item in this category, create it
          for (const item of items) {
            // Log what we're trying to create
            console.log(`Creating item ${item.name} for category ${categoryId}`);
            
            try {
              // Create a clean item object with only the fields that match the schema
              const itemToCreate: any = {
                categoryId,
                name: item.name,
                price: item.price || 0,
                description: item.description || '',
                duration: item.duration || 0,
                starch: item.starch || 'NONE',
                pressOnly: item.pressOnly !== undefined ? item.pressOnly : false,
                taxable: false, // Default value as per schema
              };
              
              // Handle image source mapping
              if (item.imageSource) {
                // Store the image source name without the extension
                itemToCreate.imageSource = item.imageSource.replace('.png', '');
              }
              
              // Handle legacy imageUrl (if present)
              if (item.imageUrl && (item.imageUrl.startsWith('http://') || item.imageUrl.startsWith('https://'))) {
                itemToCreate.imageUrl = item.imageUrl;
              }
              
              console.log(`Creating item with imageSource: ${itemToCreate.imageSource}`, itemToCreate);
              
              // Dispatch the create action
              const result = await dispatch(createItem(itemToCreate)).unwrap();
              console.log(`Successfully created item: ${result.id}`);
            } catch (error) {
              console.error(`Error creating item ${item.name}:`, error);
            }
          }
        }
      }
      
      Alert.alert(
        "Success", 
        `Successfully loaded "${categoryName}" and its products.`
      );
      onDataLoaded();
    } catch (error) {
      console.error(`Error loading category "${categoryName}":`, error);
      Alert.alert(
        "Error", 
        `Failed to load "${categoryName}". Please try again.`
      );
    } finally {
      setIsLoading(false);
      setLoadingCategory(null);
    }
  };
  
  const handleLoadAll = async () => {
    if (!userId) {
      Alert.alert("Error", "User ID is missing. Please log in again.");
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Loop through all categories and load them one by one
      for (const category of DEFAULT_CATEGORIES) {
        try {
          // Create the category
          const categoryAction = await dispatch(createCategory({
            categoryData: {
              ...category,
              userId
            },
            userId
          })).unwrap();
          
          // If successful, add its products
          if (categoryAction && categoryAction.id) {
            const categoryId = categoryAction.id;
            
            // Get the items for this category
            const items = DEFAULT_ITEMS[category.name];
            if (items && items.length > 0) {
              // Create each item for this category
              for (const item of items) {
                try {
                  // Log what we're trying to create
                  console.log(`Creating item ${item.name} for category ${categoryId}`);
                  
                  // Create a clean item object with only the fields that match the schema
                  const itemToCreate: any = {
                    categoryId,
                    name: item.name,
                    price: item.price || 0,
                    description: item.description || '',
                    duration: item.duration || 0,
                    starch: item.starch || 'NONE',
                    pressOnly: item.pressOnly !== undefined ? item.pressOnly : false,
                    taxable: false, // Default value as per schema
                  };
                  
                  // Handle image source mapping
                  if (item.imageSource) {
                    // Store the image source name without the extension
                    itemToCreate.imageSource = item.imageSource.replace('.png', '');
                  }
                  
                  // Handle legacy imageUrl (if present)
                  if (item.imageUrl && (item.imageUrl.startsWith('http://') || item.imageUrl.startsWith('https://'))) {
                    itemToCreate.imageUrl = item.imageUrl;
                  }
                  
                  console.log(`Creating item with imageSource: ${itemToCreate.imageSource}`, itemToCreate);
                  
                  // Dispatch the create action
                  const result = await dispatch(createItem(itemToCreate)).unwrap();
                  console.log(`Successfully created item: ${result.id}`);
                } catch (itemError) {
                  console.error(`Error creating item "${item.name}":`, itemError);
                  // Continue with other items even if one fails
                }
              }
            }
          }
        } catch (error) {
          console.error(`Error loading category "${category.name}":`, error);
          // Continue with other categories even if one fails
        }
      }
      
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
            <View style={styles.categoryContent}>
              <Text style={styles.categoryName}>{item.name}</Text>
              <Text style={styles.categoryDescription}>{item.description}</Text>
            </View>
            {loadingCategory === item.name && (
              <ActivityIndicator size="small" color="#007AFF" />
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
          <>
            <Ionicons name="cloud-download-outline" size={20} color="#FFFFFF" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>Load All Services</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

// Import DEFAULT_ITEMS from stockData.ts
import { DEFAULT_ITEMS } from '../../../../amplify/data/stockData';

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 16,
    width: '100%',
    maxWidth: 450,
    alignSelf: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
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
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryContent: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 14,
    color: '#666',
  },
  loadAllButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  disabledButton: {
    backgroundColor: '#999',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  buttonIcon: {
    marginRight: 8,
  }
});