// src/screens/Checkout/components/OrderSummary.tsx
import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  type: 'service' | 'product';
  serviceId?: string;
  imageUrl?: string | null;
};

interface OrderSummaryProps {
  items?: CartItem[];
  subtotal: number;
  tax: number;
  tip: number;
  total: number;
  onRemoveItem?: (itemId: string) => void;
}

const OrderSummary = ({ items = [], subtotal, tax, tip, total, onRemoveItem }: OrderSummaryProps) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Order Summary</Text>
      
      {items.length > 0 ? (
        <FlatList
          data={items}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          renderItem={({ item }) => (
            <View style={styles.itemContainer}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemQuantity}>
                  {item.quantity} x ${item.price.toFixed(2)}
                </Text>
              </View>
              <View style={styles.itemActions}>
                <Text style={styles.itemTotal}>
                  ${(item.price * item.quantity).toFixed(2)}
                </Text>
                {onRemoveItem && (
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => onRemoveItem(item.id)}
                  >
                    <Ionicons name="close-circle" size={20} color="#f44336" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
          style={styles.itemsList}
        />
      ) : (
        <Text style={styles.emptyText}>No items in order</Text>
      )}
      
      <View style={styles.divider} />
      
      <View style={styles.row}>
        <Text style={styles.label}>Subtotal</Text>
        <Text style={styles.value}>${subtotal.toFixed(2)}</Text>
      </View>
      
      <View style={styles.row}>
        <Text style={styles.label}>Tax</Text>
        <Text style={styles.value}>${tax.toFixed(2)}</Text>
      </View>
      
      <View style={styles.row}>
        <Text style={styles.label}>Tip</Text>
        <Text style={styles.value}>${tip.toFixed(2)}</Text>
      </View>
      
      <View style={styles.divider} />
      
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  itemsList: {
    maxHeight: 200,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    paddingVertical: 20,
    fontStyle: 'italic',
  },
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '500',
  },
  itemQuantity: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemTotal: {
    fontSize: 15,
    fontWeight: 'bold',
    marginRight: 10,
  },
  removeButton: {
    padding: 3,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  label: {
    fontSize: 16,
    color: '#555',
  },
  value: {
    fontSize: 16,
    color: '#333',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 10,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
  },
});

export default OrderSummary;