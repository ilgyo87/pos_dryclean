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
          <Text style={{ fontSize: 10, color: '#aaa' }}>No Image</Text>
        </View>
      )}
    </View>
    <Text style={styles.listItemName} numberOfLines={1}>{item.name}</Text>
    <Text style={styles.listItemDescription} numberOfLines={1}>
      {item.description || 'No description'}
    </Text>
    <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
  </TouchableOpacity>
);


export default ProductItem;