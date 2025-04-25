// src/screens/Customers/CustomersScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import CustomerSearchBar from './CustomerSearchBar';
import CustomerList from './CustomerList';
import AddCustomerButton from './AddCustomerButton';
import CustomerForm from './CustomerForm';
import { Customer } from '../../../types';
import { useCustomers } from '../../../hooks/useCustomers';
import { useIsFocused } from '@react-navigation/native';
import { useAuthenticator } from '@aws-amplify/ui-react-native';

interface CustomersScreenProps {
  employeeId?: string;
  firstName?: string;
  lastName?: string;
}

export default function CustomersScreen({ employeeId, firstName, lastName }: CustomersScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const { customers, isLoading, error, refetch } = useCustomers();
  const { user } = useAuthenticator((context) => [context.user]);
  // Edit modal state
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

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



  // Handle Enter key to open first customer in edit modal
  const handleSubmit = () => {
    if (filteredCustomers.length > 0) {
      setEditingCustomer(filteredCustomers[0]);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <CustomerSearchBar 
        value={searchQuery}
        onChangeText={setSearchQuery}
        onClear={() => setSearchQuery('')}
        inputProps={{
          onSubmitEditing: handleSubmit,
        }}
      />
      <CustomerList 
        customers={filteredCustomers}
        isLoading={isLoading}
        error={error}
        onRefresh={refetch}
        onCustomerSelect={c => setEditingCustomer(c)}
      />
      <AddCustomerButton userId={user?.userId} onSuccess={refetch} />
      {/* Edit Customer Modal */}
      <CustomerForm
        visible={!!editingCustomer}
        userId={user?.userId}
        onClose={() => setEditingCustomer(null)}
        onSuccess={() => {
          refetch();
          setEditingCustomer(null);
        }}
        customer={editingCustomer}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
});