import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Unified CartItem type (consider importing from a shared types file)
type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  type: 'service' | 'product';
  orderId: string;
  orderNumber: string;
  starch?: 'NONE' | 'LIGHT' | 'MEDIUM' | 'HEAVY';
  pressOnly?: boolean;
};

interface OrderSummaryProps {
  items?: CartItem[];
  subtotal: number;
  tax: number;
  tip: number;
  total: number;
  onRemoveItem?: (itemId: string) => void;
  showTotals?: boolean;
  showTitle?: boolean;
  dueDate?: Date;
  onUpdateQuantity?: (itemId: string, newQuantity: number) => void;
}

const OrderSummary = ({
  items = [],
  subtotal,
  tax,
  tip,
  total,
  onRemoveItem,
  showTotals = true,
  showTitle = true,
  dueDate,
  onUpdateQuantity
}: OrderSummaryProps) => {

  return (
    <View style={styles.container}>
      {showTitle && <Text style={styles.title}>Order Summary</Text>}

      {items.length > 0 ? (
        <View style={styles.itemsList}>
          {/* Header row for columns */}
          <View style={styles.headerRow}>
            <Text style={[styles.headerText, styles.nameColumn]}>Item</Text>
            <Text style={[styles.headerText, styles.quantityColumn]}>Qty</Text>
            <Text style={[styles.headerText, styles.priceColumn]}>Price</Text>
            <View style={styles.actionColumn}></View>
          </View>

          {items.map((item, index) => (
            <View key={`${item.id}-${index}`} style={styles.itemRow}>
              {/* Item name column */}
              <Text style={[styles.itemName, styles.nameColumn]} numberOfLines={1}>
                {item.name}
                {item.starch && item.starch !== 'NONE' ? ` (${item.starch[0]})` : ''}
                {item.pressOnly ? ' (PO)' : ''}
              </Text>

              {/* Quantity column */}
              <View style={[styles.quantityControls, styles.quantityColumn]}>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => onUpdateQuantity && onUpdateQuantity(item.id, item.quantity - 1)}
                  disabled={item.quantity <= 1}
                >
                  <Text style={[styles.quantityButtonText, item.quantity <= 1 && styles.disabledText]}>-</Text>
                </TouchableOpacity>

                <Text style={styles.quantityText}>{item.quantity}</Text>

                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => onUpdateQuantity && onUpdateQuantity(item.id, item.quantity + 1)}
                >
                  <Text style={styles.quantityButtonText}>+</Text>
                </TouchableOpacity>
              </View>

              {/* Price column */}
              <Text style={[styles.itemTotal, styles.priceColumn]}>
                ${(item.price * item.quantity).toFixed(2)}
              </Text>

              {/* Action column */}
              <View style={styles.actionColumn}>
                {onRemoveItem && (
                  <TouchableOpacity onPress={() => onRemoveItem(item.id)}>
                    <Ionicons name="trash-outline" size={20} color="#ff6b6b" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.emptyText}>No items in order</Text>
      )}

      {showTotals && (
        <View style={styles.totalsContainer}>
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

          {dueDate && (
            <View style={styles.row}>
              <Text style={styles.label}>Ready by</Text>
              <Text style={styles.value}>{dueDate.toLocaleDateString()}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  itemsList: {
    marginBottom: 15,
  },
  headerRow: {
    flexDirection: 'row',
    paddingBottom: 8,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  nameColumn: {
    flex: 4,
    paddingRight: 8,
  },
  quantityColumn: {
    flex: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  priceColumn: {
    flex: 2,
    textAlign: 'right',
  },
  actionColumn: {
    flex: 1,
    alignItems: 'flex-end',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    paddingVertical: 20,
    fontStyle: 'italic',
  },
  itemName: {
    fontSize: 15,
    fontWeight: '500',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  disabledText: {
    color: '#ccc',
  },
  quantityText: {
    fontSize: 14,
    fontWeight: '500',
    marginHorizontal: 8,
    minWidth: 20,
    textAlign: 'center',
  },
  itemTotal: {
    fontSize: 15,
    fontWeight: '500',
  },
  totalsContainer: {
    marginTop: 10,
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