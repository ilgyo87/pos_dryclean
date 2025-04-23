import React, { useState, useMemo, useRef, useImperativeHandle, forwardRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, Keyboard, StyleSheet, Modal, Pressable, Dimensions, TextInput, Button } from 'react-native';
import CustomerSearchBar from '../Categories/Customers/CustomerSearchBar';
import CustomerForm from '../Categories/Customers/CustomerForm';
import { useCustomers } from '../../hooks/useCustomers';
import type { Customer } from '../../types';
import { useNavigation } from '@react-navigation/native';

import MaterialIcons from 'react-native-vector-icons/MaterialIcons';


const CustomerQuickSearch = forwardRef<any, any>((props, ref) => {
  const [search, setSearch] = useState('');
  const [focused, setFocused] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [preFillPhone, setPreFillPhone] = useState('');
  const navigation = useNavigation<any>();
  const { customers, isLoading } = useCustomers();
  const inputRef = useRef<TextInput>(null);

  useImperativeHandle(ref, () => ({
    focus: () => {
      inputRef.current?.focus();
    },
  }));

  // Filtering logic matches CustomersScreen
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return customers;
    return customers.filter(customer =>
      customer.firstName.toLowerCase().includes(query) ||
      customer.lastName.toLowerCase().includes(query) ||
      (customer.phone && customer.phone.toLowerCase().includes(query))
    );
  }, [search, customers]);

  // Check if search is a valid 10-digit phone number and not found
  const cleanedPhone = search.replace(/\D/g, '');
  const isValidPhone = cleanedPhone.length === 10;
  const phoneExists = customers.some(
    c => c.phone && c.phone.replace(/\D/g, '') === cleanedPhone
  );
  const showAddButton = isValidPhone && !phoneExists && search.length > 0 && !isLoading;

  const handleAddCustomer = () => {
    setPreFillPhone(search);
    setShowCreateModal(true);
  };

  const handleSelect = (customer: Customer) => {
    setSearch('');
    setFocused(false);
    Keyboard.dismiss();
    navigation.navigate('Checkout', { customer });
  };

  const handleSubmit = () => {
    if (filtered.length > 0) {
      handleSelect(filtered[0]);
    }
  };

  // Overlay logic: show only when user has typed
  const showOverlay = search.length > 0;

  return (
    <View style={{ width: '100%', marginBottom: 16, zIndex: 10 }}>
      <CustomerSearchBar
        value={search}
        onChangeText={setSearch}
        onClear={() => {
          setSearch('');
          setFocused(false);
        }}
        inputProps={{
          onFocus: () => setFocused(true),
          onBlur: () => setFocused(false),
          onSubmitEditing: handleSubmit,
        }}
        inputRef={inputRef}
        rightButton={(
          <TouchableOpacity
            onPress={() => setShowCreateModal(true)}
            style={{ marginLeft: 8, padding: 4 }}
            accessibilityLabel="Create new customer"
          >
            <MaterialIcons name="add-circle" size={28} color="#007bff" />
          </TouchableOpacity>
        )}
      />
      {showOverlay && (
        <>
          <Pressable
            style={styles.overlayBg}
            onPress={() => {
              setFocused(false);
              setSearch('');
              Keyboard.dismiss();
            }}
          />
          <View style={styles.overlayContainer}>
            <FlatList
              data={filtered}
              keyExtractor={item => item._id}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <TouchableOpacity onPress={() => handleSelect(item)} style={styles.resultItem}>
                  <Text style={styles.resultText}>{item.lastName}, {item.firstName} <Text style={styles.resultPhone}>{item.phone}</Text></Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={!isLoading ? (
                <View style={{alignItems: 'center', padding: 16}}>
                  <Text style={styles.noResults}>No customers found.</Text>
                </View>
              ) : null}
              style={{ maxHeight: Dimensions.get('window').height * 0.5 }}
            />
          </View>
        </>
      )}
      <CustomerForm
        visible={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setPreFillPhone('');
          setSearch('');
          setFocused(false);
        }}
        onSuccess={(createdCustomer?: Customer) => {
          setShowCreateModal(false);
          setPreFillPhone('');
          setSearch('');
          setFocused(false);
          if (createdCustomer) {
            navigation.navigate('Checkout', { customer: createdCustomer });
          }
        }}
        customer={preFillPhone ? { phone: preFillPhone } as Customer : undefined}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  overlayBg: {
    position: 'absolute',
    top: 72, // just below the search bar
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.18)',
    zIndex: 10,
  },
  overlayContainer: {
    position: 'absolute',
    top: 72, // just below the search bar
    left: 0,
    right: 0,
    marginHorizontal: 0,
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: 16,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    zIndex: 11,
  },
  resultItem: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  resultText: {
    fontSize: 16,
  },
  resultPhone: {
    color: '#888',
  },
  noResults: {
    padding: 16,
    color: '#888',
    textAlign: 'center',
  },
});

export default CustomerQuickSearch;
