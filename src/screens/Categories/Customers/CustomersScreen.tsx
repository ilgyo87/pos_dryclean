// src/screens/Customers/CustomersScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import CustomerSearchBar from './CustomerSearchBar';
import CustomerList from './CustomerList';
import AddCustomerButton from './AddCustomerButton';
import { Customer } from '../../../types';
import { useCustomers } from '../../../hooks/useCustomers';
import { useAuthenticator } from '@aws-amplify/ui-react-native';

export default function CustomersScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const { customers, isLoading, error, refetch } = useCustomers();
  const { user } = useAuthenticator((context) => [context.user]);
  
  // Filter customers based on search query
  useEffect(() => {
    if (!customers) return;
    
    if (!searchQuery.trim()) {
      setFilteredCustomers(customers);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const filtered = customers.filter(customer => 
      customer.firstName.toLowerCase().includes(query) ||
      customer.lastName.toLowerCase().includes(query) ||
      customer.phone?.toLowerCase().includes(query)
    );
    
    setFilteredCustomers(filtered);
  }, [searchQuery, customers]);

  // Refresh the customer list when the component mounts
  useEffect(() => {
    refetch();
  }, [refetch]);

  return (
    <SafeAreaView style={styles.container}>
      <CustomerSearchBar 
        value={searchQuery}
        onChangeText={setSearchQuery}
        onClear={() => setSearchQuery('')}
      />
      <CustomerList 
        customers={filteredCustomers}
        isLoading={isLoading}
        error={error}
        onRefresh={refetch}
      />
      <AddCustomerButton userId={user?.userId} onSuccess={refetch} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
});