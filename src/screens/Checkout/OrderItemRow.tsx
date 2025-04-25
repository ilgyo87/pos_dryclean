// src/screens/Checkout/OrderItemRow_fixed.tsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Product } from '../../types';
import styles from './OrderSummary.styles';
import { hashString } from '../../utils/hashString';
import { CheckoutItem } from '../../types'; // Import CheckoutItem instead of OrderItem

interface OrderItemRowProps {
  item: CheckoutItem; // Use CheckoutItem instead of OrderItem
  onUpdateQuantity: (quantity: number) => void; // Simplified to just accept number
  onUpdateOptions: (options: any) => void; // Simplified to just accept options
  onEdit: (item: CheckoutItem) => void; // Use CheckoutItem
}

const OrderItemRow: React.FC<OrderItemRowProps> = ({
  item,
  onUpdateQuantity,
  onUpdateOptions,
  onEdit
}) => (
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
      </View>
      <View style={styles.itemRightRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {(item.options?.pressOnly || (item.options?.starch && item.options.starch !== 'none')) && (
            <View style={[styles.starchBox, { marginRight: 8, marginTop: 0, marginBottom: 0 }]}>
              <Text style={styles.starchBoxText}>
                {item.options?.pressOnly ? 'PO' : 
                 item.options?.starch === 'light' ? 'L' : 
                 item.options?.starch === 'medium' ? 'M' : 
                 item.options?.starch === 'heavy' ? 'H' : ''}
              </Text>
            </View>
          )}
          <View style={{ alignItems: 'center' }}>
            <Text style={styles.quantityLabel}>Qty</Text>
            <View style={styles.quantityControl}>
              <TouchableOpacity 
                onPress={() => {
                  // Ensure we're passing a number
                  onUpdateQuantity(item.quantity - 1);
                }} 
                style={styles.quantityButton}
              >
                <MaterialIcons name="remove" size={20} color="#007bff" />
              </TouchableOpacity>
              <Text>{item.quantity}</Text>
              <TouchableOpacity 
                onPress={() => {
                  // Ensure we're passing a number
                  onUpdateQuantity(item.quantity + 1);
                }} 
                style={styles.quantityButton}
              >
                <MaterialIcons name="add" size={20} color="#007bff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
        <TouchableOpacity 
          onPress={() => onEdit(item)} 
          style={styles.optionsButton}
        >
          <MaterialIcons name="more-vert" size={22} color="#888" style={styles.optionsEllipsis} />
        </TouchableOpacity>
      </View>
    </View>
  </View>
);

export default OrderItemRow;
