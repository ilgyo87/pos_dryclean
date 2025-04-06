import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
} from 'react-native';
import { styles } from '../styles/screens/productManagementStyles';
import { Product } from '../types/productTypes';

interface ProductItemProps {
  item: Product;
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
}

const ProductItem: React.FC<ProductItemProps> = ({ 
  item, 
  onEdit, 
  onDelete 
}) => (
  <TouchableOpacity 
    style={styles.listItemContainer}
    onPress={() => onEdit(item)}
  >
    <View style={styles.listImageContainer}>
      {item.urlPicture ? (
        <Image 
          source={{ uri: item.urlPicture }} 
          style={{ width: '100%', height: '100%', borderRadius: 4 }}
          resizeMode="cover"
        />
      ) : (
        <View style={{ width: '100%', height: '100%', backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 40, color: '#aaa' }}>No Image</Text>
        </View>
      )}
      {/* Name overlay on the image */}
      <View style={imageOverlayStyles.nameOverlay}>
        <Text style={imageOverlayStyles.nameText} numberOfLines={1}>{item.name}</Text>
        {/* Price inside the overlay below the name */}
        <Text style={imageOverlayStyles.priceText}>${item.price.toFixed(2)}</Text>
      </View>
    </View>
  </TouchableOpacity>
);

// Additional styles for the overlay
const imageOverlayStyles = StyleSheet.create({
  nameOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
  nameText: {
    color: 'white',
    fontSize: 30, // 4x larger
    fontWeight: 'bold',
    marginBottom: 4,
    // Text shadow properties
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 3,
  },
  priceText: {
    color: '#90EE90', // Green
    fontSize: 40, // 4x larger
    fontWeight: 'bold',
    // Text shadow properties
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  }
});

export default ProductItem;