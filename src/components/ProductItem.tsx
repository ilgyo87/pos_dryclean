import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
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
  <View style={styles.listItemContainer}>
    <View style={styles.listImageContainer}>
      {item.urlPicture ? (
        <Image 
          source={{ uri: item.urlPicture }} 
          style={{ width: 48, height: 48, borderRadius: 4 }}
          resizeMode="cover"
        />
      ) : (
        <Text style={styles.listImagePlaceholder}>No Image</Text>
      )}
    </View>
    <Text style={styles.listItemName} numberOfLines={1}>{item.name}</Text>
    <Text style={styles.listItemDescription} numberOfLines={1}>
      {item.description || 'No description'}
    </Text>
    <Text style={styles.listItemPrice}>${item.price.toFixed(2)}</Text>
    <View style={styles.listItemActions}>
      <TouchableOpacity
        style={styles.listEditButton}
        onPress={() => onEdit(item)}
      >
        <Text style={styles.listEditIcon}>✏️</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.listDeleteButton}
        onPress={() => onDelete(item.id)}
      >
        <Text style={styles.listDeleteIcon}>🗑️</Text>
      </TouchableOpacity>
    </View>
  </View>
);

export default ProductItem;