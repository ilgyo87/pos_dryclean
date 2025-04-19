import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { CartItem } from "../types/types";

interface CartItemRowProps {
  item: CartItem;
  onUpdateQuantity?: (id: string, quantity: number) => void;
  onRemoveItem?: (id: string) => void;
  editable?: boolean;
}

const CartItemRow: React.FC<CartItemRowProps> = ({
  item,
  onUpdateQuantity,
  onRemoveItem,
  editable = true
}) => {
  return (
    <View style={styles.itemRow}>
      {/* Name column */}
      <View style={styles.nameColumn}>
        <Text style={styles.itemName}>{item.name}</Text>
      </View>
      
      {/* Quantity column */}
      <View style={styles.quantityColumn}>
        {editable && onUpdateQuantity ? (
          <>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => onUpdateQuantity(item.id, item.quantity - 1)}
              disabled={item.quantity <= 1}
            >
              <Text style={[styles.quantityButtonText, item.quantity <= 1 && styles.disabledText]}>-</Text>
            </TouchableOpacity>
            <Text style={styles.quantityText}>{item.quantity}</Text>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => onUpdateQuantity(item.id, item.quantity + 1)}
            >
              <Text style={styles.quantityButtonText}>+</Text>
            </TouchableOpacity>
          </>
        ) : (
          <Text style={styles.quantityText}>{item.quantity}</Text>
        )}
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
  );
};

const styles = StyleSheet.create({
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  nameColumn: {
    flex: 4,
    paddingRight: 8,
  },
  quantityColumn: {
    flex: 3,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  priceColumn: {
    flex: 2,
    textAlign: "right",
  },
  actionColumn: {
    flex: 1,
    alignItems: "flex-end",
  },
  itemName: {
    fontSize: 15,
    fontWeight: "500",
  },
  quantityButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  quantityButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  disabledText: {
    color: "#ccc",
  },
  quantityText: {
    fontSize: 14,
    fontWeight: "500",
    marginHorizontal: 8,
    minWidth: 20,
    textAlign: "center",
  },
  itemTotal: {
    fontSize: 15,
    fontWeight: "500",
  },
});

export default CartItemRow;
