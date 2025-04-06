// src/components/ServiceTabs.tsx
import React from 'react';
import {
  ScrollView,
  TouchableOpacity,
  Text,
} from 'react-native';
import { styles } from '../styles/screens/productManagementStyles';
import { Schema } from '../../amplify/data/resource';
import { Category as AppCategory } from '../types/productTypes';


// Use the Category type from the schema instead of Service
type Category = Schema['Category']['type'];

interface CategoryTabsProps {
  categories: AppCategory[];
  selectedCategoryId: string | null;
  onSelect: (categoryId: string) => void;
}

// Rename component to CategoryTabs for consistency
const CategoryTabs: React.FC<CategoryTabsProps> = ({ 
  categories, 
  selectedCategoryId, 
  onSelect 
}) => {
  // Sort categories by createdAt date (oldest first)
  const sortedCategories = [...categories].sort((a, b) => {
    // Both have createdAt timestamps
    if (a.createdAt && b.createdAt) {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
    
    // Handle cases where one record doesn't have createdAt
    if (a.createdAt) return -1;
    if (b.createdAt) return 1;
    
    // Fall back to sorting by name if no timestamps
    return a.name.localeCompare(b.name);
  });

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 0 }}
    >
      {sortedCategories.map((category) => (
        <TouchableOpacity
          key={category.id}
          style={[
            styles.tab,
            selectedCategoryId === category.id && styles.activeTab
          ]}
          onPress={() => onSelect(category.id)}
        >
          <Text
            style={[
              styles.tabText,
              selectedCategoryId === category.id && styles.activeTabText
            ]}
          >
            {category.name}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

// Export as both names for backward compatibility during transition
export { CategoryTabs as ServiceTabs };
export default CategoryTabs;