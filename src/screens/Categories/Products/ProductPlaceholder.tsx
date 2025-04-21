// src/components/Products/ProductPlaceholder.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

interface ProductPlaceholderProps {
  categoryId: string;
  size?: number;
}

/**
 * A component to display when product images fail to load
 * Uses different icons based on category
 */
const ProductPlaceholder: React.FC<ProductPlaceholderProps> = ({ 
  categoryId, 
  size = 30 
}) => {
  // Choose icon based on category
  let iconName = 'dry-cleaning';
  let iconColor = '#666';
  
  switch (categoryId) {
    case '1': // Shirts
      iconName = 'dry-cleaning';
      iconColor = '#4285F4'; // Blue
      break;
    case '2': // Pants
      iconName = 'dry-cleaning';
      iconColor = '#34A853'; // Green
      break;
    case '3': // Dresses
      iconName = 'dry-cleaning';
      iconColor = '#EA4335'; // Red
      break;
    case '4': // Suits
      iconName = 'dry-cleaning';
      iconColor = '#FBBC05'; // Yellow 
      break;
    case '5': // Coats
      iconName = 'dry-cleaning';
      iconColor = '#AA00FF'; // Purple
      break;
    default:
      iconName = 'dry-cleaning';
      iconColor = '#666';
  }
  
  return (
    <View style={styles.placeholder}>
      <MaterialIcons name={iconName} size={size} color={iconColor} />
    </View>
  );
};

const styles = StyleSheet.create({
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
});

export default ProductPlaceholder;