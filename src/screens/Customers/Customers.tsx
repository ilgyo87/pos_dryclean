// src/screens/Customers/Customers.tsx
import React, { useState, useCallback, useEffect } from "react";
import { View, SafeAreaView, Text, ActivityIndicator } from "react-native";
import { AuthUser } from "aws-amplify/auth";
import { useFocusEffect } from "@react-navigation/native";
import CustomerList from "./components/CustomerList";
import CustomerToolbar from "./components/CustomerToolbar";
import styles from "./styles/CustomerStyles";
import { Schema } from "../../../amplify/data/resource";
import CreateFormModal from "../../components/CreateFormModal";
import PredictiveSearch from "../../components/PredictiveSearch";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../store";
import { fetchCustomers } from "../../store/slices/CustomerSlice";

export default function Customers({ user, navigation }: { user: AuthUser | null, navigation?: any }) {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit'>('create');
  const [editingCustomer, setEditingCustomer] = useState<Schema["Customer"]["type"] | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Redux hooks
  const dispatch = useDispatch<AppDispatch>();
  const { customers, isLoading, error } = useSelector((state: RootState) => state.customer);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch customers when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (user?.userId) {
        dispatch(fetchCustomers(user.userId));
      }
    }, [user?.userId, dispatch])
  );

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

  const filteredCustomers = customers?.filter((customer) => {
    if (!searchQuery) return true;

    const searchLower = searchQuery.toLowerCase();
    return (
      customer.firstName?.toLowerCase().includes(searchLower) ||
      customer.lastName?.toLowerCase().includes(searchLower) ||
      customer.email?.toLowerCase().includes(searchLower) ||
      customer.phoneNumber?.includes(searchQuery)
    );
  });

  const handleCustomerSearch = (customer: Schema["Customer"]["type"]) => {
    // Instead of navigating, open the edit modal
    setModalType('edit');
    setEditingCustomer(customer);
    setIsModalVisible(true);
  };

  const handleRefresh = async () => {
    if (user?.userId) {
      setRefreshing(true);
      await dispatch(fetchCustomers(user.userId));
      setRefreshing(false);
    }
  };

  if (isLoading && !refreshing) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  const closeModal = () => {
    setIsModalVisible(false);
    // Refresh the customer list when modal closes
    if (user?.userId) {
      dispatch(fetchCustomers(user.userId));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Customers</Text>
        </View>

        <View style={styles.searchContainer}>
          <PredictiveSearch 
            customers={customers || []} 
            onCustomerSelect={handleCustomerSearch}
          />
        </View>

        <CustomerToolbar onCreatePress={handleCreateCustomer} />

        <CustomerList
          customers={filteredCustomers || []}
          onCustomerPress={handleEditCustomer}
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
        
        {isModalVisible && (
          <CreateFormModal
            visible={isModalVisible}
            onClose={closeModal}
            params={{
              userId: user?.userId,
              customer: editingCustomer
            }}
            type="Customer"
            createOrEdit={modalType}
          />
        )}
      </View>
    </SafeAreaView>
  );
}