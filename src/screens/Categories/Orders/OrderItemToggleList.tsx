import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Product } from '../../../types';

interface OrderItemToggleListProps {
  items: Product[];
  selectedIds: Set<string>;
  onToggle: (itemId: string) => void;
}

const OrderItemToggleList: React.FC<OrderItemToggleListProps> = ({ items, selectedIds, onToggle }) => {
  return (
    <View style={styles.container}>
      {items.map(item => (
        <TouchableOpacity
          key={item._id}
          style={[styles.chip, selectedIds.has(item._id) ? styles.chipSelected : styles.chipDeselected]}
          onPress={() => onToggle(item._id)}
        >
          <Text style={selectedIds.has(item._id) ? styles.chipTextSelected : styles.chipTextDeselected}>
            {item.name}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 8,
  },
  chip: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    margin: 4,
    borderWidth: 1,
  },
  chipSelected: {
    backgroundColor: '#2196F3',
    borderColor: '#1976D2',
  },
  chipDeselected: {
    backgroundColor: '#f0f0f0',
    borderColor: '#ccc',
  },
  chipTextSelected: {
    color: 'white',
    fontWeight: 'bold',
  },
  chipTextDeselected: {
    color: '#333',
  },
});

export default OrderItemToggleList;
