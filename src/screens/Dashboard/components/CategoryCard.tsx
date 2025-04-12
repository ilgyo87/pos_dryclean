// src/screens/Dashboard/components/CategoryCard.tsx
import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DashboardCategory } from '../../../types';

interface CategoryCardProps {
  category: DashboardCategory;
  onPress: (id: string) => void;
  width: number;
}

export default function CategoryCard({ category, onPress, width }: CategoryCardProps) {
  const cardStyle = {
    ...styles.card,
    backgroundColor: category.color,
    width: `${width}%` as any // Cast to any to bypass the TypeScript error
  };
  
  return (
    <TouchableOpacity
      key={category.id}
      style={cardStyle}
      onPress={() => onPress(category.id)}
    >
      <View style={styles.cardHeader}>
        <Ionicons name={category.icon} size={32} color="#fff" />
        {category.count !== undefined && (
          <Text style={styles.count}>{category.count}</Text>
        )}
      </View>
      <Text style={styles.cardTitle}>{category.title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 12,
    margin: '1%',      
    height: 140,      
    justifyContent: 'space-between',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    width: '100%'
  },
  cardTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  count: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  }
});