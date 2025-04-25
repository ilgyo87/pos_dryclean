import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Product } from '../../types';
import styles from './OrderSummary.styles';
import { hashString } from '../../utils/hashString';

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
        </Text>
        <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
        {item.options?.notes && (
          <Text style={styles.optionText} numberOfLines={1}>Note: {item.options.notes}</Text>
        )}
        {item.options?.notes && (
          <Text style={styles.optionText} numberOfLines={1}>Note: {item.options.notes}</Text>
        )}
      </View>
      <View style={styles.itemRightRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {(item.options?.pressOnly || (item.options?.starch && item.options.starch !== 'none')) && (
            <View style={[styles.starchBox, { marginRight: 8, marginTop: 0, marginBottom: 0 }]}> 
              <Text style={styles.starchBoxText}>
                {item.options?.pressOnly
                  ? 'PO'
                  : item.options?.starch === 'light'
                    ? 'L'
                    : item.options?.starch === 'medium'
                      ? 'M'
                      : item.options?.starch === 'heavy'
                        ? 'H'
                        : ''}
              </Text>
            </View>
          )}
          <View style={{ alignItems: 'center' }}>
            <Text style={styles.quantityLabel}>Qty</Text>
            <View style={styles.quantityControl}>
              <TouchableOpacity onPress={() => {
                const optionsStr = item.options ? JSON.stringify(item.options) : '';
                const itemKey = `${item._id}_${hashString(optionsStr)}`;
                onUpdateQuantity(itemKey, item.quantity - 1);
              }} style={styles.quantityButton}>
                <MaterialIcons name="remove" size={20} color="#007bff" />
              </TouchableOpacity>
              <Text>{item.quantity}</Text>
              <TouchableOpacity onPress={() => {
                const optionsStr = item.options ? JSON.stringify(item.options) : '';
                const itemKey = `${item._id}_${hashString(optionsStr)}`;
                onUpdateQuantity(itemKey, item.quantity + 1);
              }} style={styles.quantityButton}>
                <MaterialIcons name="add" size={20} color="#007bff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <TouchableOpacity onPress={() => onEdit(item)} style={styles.optionsButton}>
          <MaterialIcons name="more-vert" size={22} color="#888" style={styles.optionsEllipsis} />
        </TouchableOpacity>
      </View>
    </View>
  </View>
);

export default OrderItemRow;
