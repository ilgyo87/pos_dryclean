import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Product } from '../../types';
import styles from './OrderSummary.styles';

import { OrderItem } from './OrderSummary';

interface OrderItemRowProps {
  item: OrderItem;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onUpdateOptions: (productId: string, options: any) => void;
  onEdit: (item: OrderItem) => void;
}

const OrderItemRow: React.FC<OrderItemRowProps> = ({ item, onUpdateQuantity, onUpdateOptions, onEdit }) => (
  <View style={styles.itemContainer}>
    <View style={styles.itemRow}>
      <View style={styles.itemLeft}>
        <Text style={styles.itemName}>
          {item.name}
          {item.options?.starch && (
            <Text style={styles.starchBoxText}> ({
              item.options.starch === 'light' ? 'Light' :
              item.options.starch === 'medium' ? 'Medium' :
              item.options.starch === 'heavy' ? 'Heavy' : ''
            })</Text>
          )}
        </Text>
        <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
        {item.options?.pressOnly && (
          <Text style={styles.optionText}>Press Only</Text>
        )}
        {item.options?.notes && (
          <Text style={styles.optionText} numberOfLines={1}>Note: {item.options.notes}</Text>
        )}
      </View>
      <View style={styles.itemRightRow}>
        <Text style={styles.quantityLabel}>Qty:</Text>
        <View style={styles.quantityControl}>
          <TouchableOpacity onPress={() => onUpdateQuantity(item._id, item.quantity - 1)} style={styles.quantityButton}>
            <MaterialIcons name="remove" size={20} color="#007bff" />
          </TouchableOpacity>
          <Text>{item.quantity}</Text>
          <TouchableOpacity onPress={() => onUpdateQuantity(item._id, item.quantity + 1)} style={styles.quantityButton}>
            <MaterialIcons name="add" size={20} color="#007bff" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={() => onEdit(item)} style={styles.optionsButton}>
          <MaterialIcons name="more-vert" size={22} color="#888" style={styles.optionsEllipsis} />
        </TouchableOpacity>
      </View>
    </View>
  </View>
);

export default OrderItemRow;
