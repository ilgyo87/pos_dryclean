// src/components/Products/CategoryTabs.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import type { Category } from '../../../types';

interface CategoryTabsProps {
  categories: Category[];
  selectedCategory: string | null;
  onSelectCategory: (categoryId: string) => void;
  onAddCategory: () => void;
  onEditCategory?: (category: Category) => void;
} 

const CategoryTabs: React.FC<CategoryTabsProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  onAddCategory,
  onEditCategory,
}) => {
  return (
    <View style={styles.categoriesContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesScrollContent}
      >
        {categories.map((category) => {
          const isSelected = category._id === selectedCategory;
          
          return (
            <TouchableOpacity
              key={category._id}
              style={[styles.categoryTab, isSelected && styles.selectedCategoryTab]}
              onPress={() => onSelectCategory(category._id)}
              onLongPress={() => onEditCategory?.(category)}
            >
              <Text style={[styles.categoryText, isSelected && styles.selectedCategoryText]}>
                {category.name}
              </Text>
            </TouchableOpacity>
          );
        })}
        
        <TouchableOpacity 
          style={styles.addCategoryButton}
          onPress={onAddCategory}
        >
          <MaterialIcons name="add" size={20} color="#007bff" />
          <Text style={styles.addCategoryText}>Add Category</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  categoriesContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  categoriesScrollContent: {
    paddingHorizontal: 8,
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 4,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  selectedCategoryTab: {
    borderBottomColor: '#007bff',
  },
  categoryText: {
    fontSize: 15,
    color: '#666',
  },
  selectedCategoryText: {
    color: '#007bff',
    fontWeight: '600',
  },
  addCategoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 4,
  },
  addCategoryText: {
    fontSize: 14,
    color: '#007bff',
    marginLeft: 4,
  },
});

export default CategoryTabs;