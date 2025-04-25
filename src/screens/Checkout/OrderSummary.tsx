// src/screens/Checkout/OrderSummary.tsx
// Update the OrderSummary component props interface

import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { OrderItem } from '../../types';
import OrderItemRow from './OrderItemRow';

// Update the props interface to match the expected props
export interface OrderSummaryProps {
  items: OrderItem[];
  onUpdateQuantity: (itemId: string, options: any, quantity: number) => void;
  onUpdateOptions: (itemId: string, oldOptions: any, newOptions: any) => void;
  total: number;
}

const OrderSummary: React.FC<OrderSummaryProps> = ({ 
  items, 
  onUpdateQuantity, 
  onUpdateOptions,
  total 
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Order Summary</Text>
      
      {items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No items in order</Text>
        </View>
      ) : (
        <>
          <FlatList
            data={items}
            renderItem={({ item }) => (
              <OrderItemRow
                item={item}
                onUpdateQuantity={(quantity) => {
                  onUpdateQuantity(item._id, item.options, quantity);
                }}
                onUpdateOptions={(newOptions) => {
                  onUpdateOptions(item._id, item.options, newOptions);
                }}
              />
            )}
            keyExtractor={(item) => {
              const optionsStr = item.options ? JSON.stringify(item.options) : '';
              return `${item._id}_${optionsStr}`;
            }}
            style={styles.itemsList}
          />
          
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalAmount}>${total.toFixed(2)}</Text>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 5,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  itemsList: {
    maxHeight: 300,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: '#666',
    fontStyle: 'italic',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 15,
    marginTop: 10,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
});

export default OrderSummary;
