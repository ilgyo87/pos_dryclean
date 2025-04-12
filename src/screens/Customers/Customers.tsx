// src/screens/Customers/Customers.tsx
import React, { useState, useCallback, useEffect } from "react";
import { View, SafeAreaView, Text, ActivityIndicator } from "react-native";
import { AuthUser } from "aws-amplify/auth";
import { useFocusEffect } from "@react-navigation/native";
import { SearchBar } from "../../components/SearchBar";
import CustomerList from "./components/CustomerList";
import CustomerToolbar from "./components/CustomerToolbar";
import { useCustomersData } from "./hooks/useCustomerData";
import styles from "./styles/CustomerStyles";
import { Schema } from "../../../amplify/data/resource";
import CreateFormModal from "../../components/CreateFormModal";

export default function Customers({ user, navigation }: { user: AuthUser | null, navigation?: any }) {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit'>('create');
  const [editingCustomer, setEditingCustomer] = useState<Schema["Customer"]["type"] | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Refetch when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchCustomers();
    }, [user?.userId])
  );

  const { customers, isLoading, fetchCustomers, refreshing, setRefreshing } = useCustomersData(user);

  useEffect(() => {
    console.log(`Customer count: ${customers?.length || 0}`);
  }, [customers]);

  const handleCreateCustomer = () => {
    if (!user) return;
    setModalType('create');
    setEditingCustomer(null);
    setIsModalVisible(true);
  };

  const handleEditCustomer = (customer: Schema["Customer"]["type"]) => {
    setModalType('edit');
    setEditingCustomer(customer);
    setIsModalVisible(true);
  };

  const filteredCustomers = customers?.filter(customer => {
    if (!searchQuery) return true;

    const searchLower = searchQuery.toLowerCase();
    return (
      customer.firstName?.toLowerCase().includes(searchLower) ||
      customer.lastName?.toLowerCase().includes(searchLower) ||
      customer.email?.toLowerCase().includes(searchLower) ||
      customer.phoneNumber?.includes(searchQuery)
    );
  });

  if (isLoading && !refreshing) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  const closeModal = () => {
    setIsModalVisible(false);
  };
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
        {isModalVisible && (
          <CreateFormModal
            visible={isModalVisible}
            onClose={closeModal}
            params={{
              userId: user?.userId,
              fetchCustomers,
              ...(editingCustomer ? { customer: editingCustomer } : {})
            }}
            type="Customer"
            createOrEdit={modalType}  // Change from hardcoded 'edit' to use modalType state
          />
        )}
      </View>
    </SafeAreaView>
  );
}