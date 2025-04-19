// src/screens/Customers/components/CustomerCard.tsx
import React from "react";
import { TouchableOpacity, Text, View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface CustomerCardProps {
  customer: any;
  onPress: () => void;
}

export default function CustomerCard({ customer, onPress }: CustomerCardProps) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
    >
      <View style={styles.avatar}>
        <Ionicons name="person" size={24} color="#fff" />
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{customer.firstName} {customer.lastName}</Text>
        {customer.email && <Text style={styles.detail}>{customer.email}</Text>}
        {customer.phoneNumber && <Text style={styles.detail}>{customer.phoneNumber}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={24} color="#cccccc" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 8,
    marginHorizontal: 2,
    marginVertical: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#4285F4",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  detail: {
    fontSize: 14,
    color: "#666",
  }
});