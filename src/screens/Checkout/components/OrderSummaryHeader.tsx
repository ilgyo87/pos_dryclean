import React from "react";
import { View, Text, StyleSheet } from "react-native";

interface OrderSummaryHeaderProps {
  showQuantityColumn?: boolean;
  showPriceColumn?: boolean;
  showActionColumn?: boolean;
}

const OrderSummaryHeader: React.FC<OrderSummaryHeaderProps> = ({
  showQuantityColumn = true,
  showPriceColumn = true,
  showActionColumn = true
}) => {
  return (
    <View style={styles.headerRow}>
      <Text style={[styles.headerText, { flex: 4 }]}>Item</Text>
      {showQuantityColumn && (
        <Text style={[styles.headerText, { flex: 3, textAlign: "center" }]}>Qty</Text>
      )}
      {showPriceColumn && (
        <Text style={[styles.headerText, { flex: 2, textAlign: "right" }]}>Price</Text>
      )}
      {showActionColumn && (
        <Text style={[styles.headerText, { flex: 1 }]}></Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    paddingBottom: 8,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
});

export default OrderSummaryHeader;
