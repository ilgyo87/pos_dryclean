import React from "react";
import { View, Text, StyleSheet } from "react-native";
import CartItemRow from "./CartItemRow";
import OrderTotals from "./OrderTotals";
import OrderSummaryHeader from "../components/OrderSummaryHeader";
import { CartItem } from "../types/types";

interface OrderSummaryProps {
  items: CartItem[];
  subtotal: number;
  tax: number;
  tip: number;
  total: number;
  dueDate?: Date;
  onUpdateQuantity?: (id: string, quantity: number) => void;
  onRemoveItem?: (id: string) => void;
  showTotals?: boolean;
  editable?: boolean;
  title?: string;
}

const OrderSummary: React.FC<OrderSummaryProps> = ({
  items,
  subtotal,
  tax,
  tip,
  total,
  dueDate,
  onUpdateQuantity,
  onRemoveItem,
  showTotals = true,
  editable = true,
  title = "Order Summary"
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      
      {items.length > 0 ? (
        <View style={styles.itemsList}>
          <OrderSummaryHeader />
          
          {items.map(item => (
            <CartItemRow 
              key={item.id}
              item={item}
              onUpdateQuantity={onUpdateQuantity}
              onRemoveItem={onRemoveItem}
              editable={editable}
            />
          ))}
        </View>
      ) : (
        <Text style={styles.emptyText}>No items in order</Text>
      )}
      
      {showTotals && (
        <OrderTotals
          subtotal={subtotal}
          tax={tax}
          tip={tip}
          total={total}
          dueDate={dueDate}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },
  itemsList: {
    marginBottom: 15,
  },
  emptyText: {
    textAlign: "center",
    color: "#999",
    paddingVertical: 20,
    fontStyle: "italic",
  }
});

export default OrderSummary;
