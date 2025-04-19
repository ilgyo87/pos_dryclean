// src/screens/Dashboard/components/DashboardGrid.tsx
import React from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { DashboardCategory } from '../../../types';
import CategoryCard from './CategoryCard';

interface DashboardGridProps {
  categories: DashboardCategory[];
  onCardPress: (id: string) => void;
}

export const DashboardGrid = ({ categories, onCardPress }: DashboardGridProps) => {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  
  const getGridColumns = () => {
    if (isLandscape) {
      // Return 3 columns for larger screens, 2 for smaller
      return width > 1024 ? 3 : 2;
    }
    // Return 3 columns for larger screens, 2 for smaller
    return width > 768 ? 3 : 2;
  };

  const columnCount = getGridColumns();
  const cardWidth = 141 / columnCount - 1; // 4% for margins (2% on each side)

  return (
    <View style={styles.grid}>
      {categories.map((category) => (
        <CategoryCard 
          key={category.id}
          category={category} 
          onPress={onCardPress}
          width={cardWidth}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingVertical: 4, 
    marginTop: 30,      
    gap: 9, 
    paddingHorizontal: 10,
  }
});

export default DashboardGrid;