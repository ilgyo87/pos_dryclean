// src/screens/Customers/components/CustomerList.tsx
import React from "react";
import { FlatList, StyleSheet, RefreshControl, Text, View } from "react-native";
import CustomerCard from "./CustomerCard";

interface CustomerListProps {
  customers: any[];
  onCustomerPress: (customer: any) => void;
  refreshing: boolean;
  onRefresh: () => void;
}

export default function CustomerList({ 
  customers, 
  onCustomerPress,
  refreshing,
  onRefresh
}: CustomerListProps) {
  
  if (customers.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No customers found</Text>
      </View>
    );
  }
  
  return (
    <FlatList
      data={customers}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <CustomerCard customer={item} onPress={() => onCustomerPress(item)} />
      )}
      style={styles.list}
      contentContainerStyle={styles.listContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    />
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
    width: "100%",
  },
  listContent: {
    paddingBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
  }
});