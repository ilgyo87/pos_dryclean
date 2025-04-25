// src/screens/Dashboard/CategoriesGrid.tsx - Updated version with onSelectCategory prop

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

// Updated CategoryItem interface to remove onPress from individual items
interface CategoryItem {
  id: string;
  title: string;
  count: number;
  screen?: string; // Optional screen property for navigation
}

// Updated CategoriesGridProps interface to include onSelectCategory
interface CategoriesGridProps {
  categories: CategoryItem[];
  onSelectCategory?: (category: CategoryItem) => void; // Added onSelectCategory prop
}

const CategoriesGrid: React.FC<CategoriesGridProps> = ({ 
  categories,
  onSelectCategory 
}) => (
  <View style={styles.grid}>
    {categories.map(cat => (
      <TouchableOpacity
        key={cat.id}
        style={styles.card}
        onPress={() => onSelectCategory && onSelectCategory(cat)} // Use onSelectCategory prop
        activeOpacity={0.8}
      >
        <Text style={styles.cardTitle}>{cat.title}</Text>
        <Text style={styles.cardCount}>{cat.count}</Text>
      </TouchableOpacity>
    ))}
  </View>
);

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  card: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  cardCount: {
    fontSize: 16,
    color: '#007bff',
    fontWeight: 'bold',
  },
});

export default CategoriesGrid;
