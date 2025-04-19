import React from "react";
import { View, Text, StyleSheet } from "react-native";

interface OrderTotalsProps {
  subtotal: number;
  tax: number;
  tip: number;
  total: number;
  dueDate?: Date;
}

const OrderTotals: React.FC<OrderTotalsProps> = ({
  subtotal,
  tax,
  tip,
  total,
  dueDate
}) => {
  return (
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
  );
};

const styles = StyleSheet.create({
  totalsContainer: {
    marginTop: 10,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  label: {
    fontSize: 16,
    color: "#555",
  },
  value: {
    fontSize: 16,
    color: "#333",
  },
  divider: {
    height: 1,
    backgroundColor: "#eee",
    marginVertical: 10,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 5,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2196F3",
  },
});

export default OrderTotals;
