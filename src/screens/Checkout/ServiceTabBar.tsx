import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList
} from 'react-native';
import { Category } from '../../types';

interface ServiceTabBarProps {
  categories: Category[];
  selectedCategory: string | null;
  onSelectCategory: (categoryId: string) => void;
  isLoading: boolean;
}

const ServiceTabBar: React.FC<ServiceTabBarProps> = ({
  categories = [], // Default to empty array if categories is undefined
  selectedCategory,
  onSelectCategory,
  isLoading
}) => {
  // Debug log to verify the categories being passed to the component
  console.log(`[ServiceTabBar] Rendering with ${categories?.length || 0} categories, isLoading: ${isLoading}`);
  if (categories && categories.length > 0) {
    console.log('[ServiceTabBar] First category:', categories[0].name);
  }
  
  // Debug selected category
  console.log(`[ServiceTabBar] Selected category: ${selectedCategory}`);
  
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#007bff" />
        <Text style={styles.loadingText}>Loading categories...</Text>
      </View>
    );
  }

  if (!categories || categories.length === 0) {

    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No categories available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsContainer}
      >
        {categories.map((category) => {
          const isSelected = category._id === selectedCategory;
          
          return (
            <TouchableOpacity
              key={category._id}
              style={[
                styles.tab,
                isSelected && styles.selectedTab,
                category.color ? { backgroundColor: category.color + '20' } : null // Add 20% opacity
              ]}
              onPress={() => onSelectCategory(category._id)}
            >
              <Text 
                style={[
                  styles.tabText, 
                  isSelected && styles.selectedTabText,
                  category.color ? { color: category.color } : null
                ]}
              >
                {category.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabsContainer: {
    paddingBottom: 4,
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedTab: {
    borderColor: '#007bff',
    borderWidth: 4,
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  selectedTabText: {
    color: '#007bff',
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    marginBottom: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    marginBottom: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
});

export default ServiceTabBar;