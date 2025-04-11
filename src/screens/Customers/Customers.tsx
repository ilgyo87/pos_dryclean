// src/screens/Customers/Customers.tsx
import React, { useState, useCallback } from "react";
import { View, SafeAreaView, Text, ActivityIndicator } from "react-native";
import { AuthUser } from "aws-amplify/auth";
import { useFocusEffect } from "@react-navigation/native";
import { SearchBar } from "../../components/SearchBar";
import CustomerList from "./components/CustomerList";
import CustomerToolbar from "./components/CustomerToolbar";
import { useCustomersData } from "./hooks/useCustomerData";
import styles from "./styles/CustomerStyles";
import { Schema } from "../../../amplify/data/resource";

export default function Customers({ user, navigation }: { user: AuthUser | null, navigation?: any }) {
  const [searchQuery, setSearchQuery] = useState("");
  const { customers, isLoading, fetchCustomers, refreshing, setRefreshing } = useCustomersData(user);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  
  // Refetch when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchCustomers();
    }, [user?.userId])
  );

  const handleCreateCustomer = () => {
    navigation.navigate('CustomerForm', { mode: 'create' });
  };

  const handleEditCustomer = (customer: Schema["Customer"]["type"]) => {
    navigation.navigate('CustomerForm', { mode: 'edit', customer });
  };

  const filteredCustomers = customers?.filter(customer => {
    if (!searchQuery) return true;
    
    const searchLower = searchQuery.toLowerCase();
    return (
      customer.firstName?.toLowerCase().includes(searchLower) ||
      customer.lastName?.toLowerCase().includes(searchLower) ||
      customer.email?.toLowerCase().includes(searchLower) ||
      customer.phone?.includes(searchQuery)
    );
  });

  if (isLoading && !refreshing) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Customers</Text>
        </View>
        
        <SearchBar 
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search by name, email or phone..."
        />

        <CustomerToolbar onCreatePress={handleCreateCustomer} />
        
        <CustomerList 
          customers={filteredCustomers || []}
          onCustomerPress={handleEditCustomer}
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            fetchCustomers().finally(() => setRefreshing(false));
          }}
        />
      </View>
    </SafeAreaView>
  );
}