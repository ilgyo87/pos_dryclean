// src/screens/Dashboard/CustomerQuickSearch.tsx
import React, { useState, useMemo, useRef, useImperativeHandle, forwardRef, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Keyboard, StyleSheet, Pressable, Dimensions, TextInput } from 'react-native';
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
  const { customers, isLoading, refetch } = useCustomers();
  const inputRef = useRef<TextInput>(null);

  // Expose focus method to parent components
  useImperativeHandle(ref, () => ({
    focus: () => {
      inputRef.current?.focus();
    },
  }));

  // Safe filtering logic with error handling and debugging
  const filtered = useMemo(() => {
    try {
      const query = search.trim().toLowerCase();
      if (!query) return [];
      
      console.log(`[CustomerQuickSearch] Filtering ${customers?.length || 0} customers with query "${query}"`);
      
      // Ensure we're working with valid data
      if (!Array.isArray(customers)) {
        console.warn('[CustomerQuickSearch] customers is not an array:', typeof customers);
        return [];
      }
      
      // Filter with defensive programming
      return customers.filter(customer => {
        if (!customer) {
          console.warn('[CustomerQuickSearch] Null customer in array');
          return false;
        }
        
        try {
          // Use optional chaining and nullish coalescing for safety
          const firstName = typeof customer.firstName === 'string' ? customer.firstName.toLowerCase() : '';
          const lastName = typeof customer.lastName === 'string' ? customer.lastName.toLowerCase() : '';
          const phone = typeof customer.phone === 'string' ? customer.phone.toLowerCase() : '';
          
          return firstName.includes(query) || 
                 lastName.includes(query) || 
                 phone.includes(query);
        } catch (e) {
          console.error('[CustomerQuickSearch] Error filtering customer:', e, customer);
          return false;
        }
      });
    } catch (e) {
      console.error('[CustomerQuickSearch] Error in filter function:', e);
      return [];
    }
  }, [search, customers]);

  // Check if search is a valid phone number not in the database
  const cleanedPhone = useMemo(() => search.replace(/\D/g, ''), [search]);
  const isValidPhone = cleanedPhone.length === 10;
  const phoneExists = useMemo(() => {
    if (!isValidPhone || !Array.isArray(customers)) return false;
    return customers.some(c => c?.phone?.replace(/\D/g, '') === cleanedPhone);
  }, [cleanedPhone, customers, isValidPhone]);
  
  const showAddButton = isValidPhone && !phoneExists && search.length > 0 && !isLoading;

  // Handler functions
  const handleAddCustomer = useCallback(() => {
    setPreFillPhone(search);
    setShowCreateModal(true);
  }, [search]);

  const handleSelect = useCallback((customer: Customer) => {
    setSearch('');
    setFocused(false);
    Keyboard.dismiss();
    
    // Make a clean copy of the customer to pass to navigation
    const cleanCustomer = {
      ...customer,
      createdAt: customer.createdAt ? new Date(customer.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: customer.updatedAt ? new Date(customer.updatedAt).toISOString() : null,
      notes: Array.isArray(customer.notes) ? [...customer.notes] : [],
    };
    
    navigation.navigate('Checkout', { customer: cleanCustomer });
  }, [navigation]);

  const handleSubmit = useCallback(() => {
    if (filtered.length > 0) {
      handleSelect(filtered[0]);
    }
  }, [filtered, handleSelect]);

  const handleClearSearch = useCallback(() => {
    setSearch('');
    setFocused(false);
  }, []);

  // Only show overlay when user has typed and the component is focused
  const showOverlay = search.length > 0 && focused;

  // Handle modal close
  const handleCloseModal = useCallback(() => {
    setShowCreateModal(false);
    setPreFillPhone('');
    setSearch('');
    setFocused(false);
    // Refresh customer data after modal closes
    refetch();
  }, [refetch]);

  // Handle successful customer creation
  const handleCustomerCreated = useCallback((createdCustomer?: Customer) => {
    handleCloseModal();
    if (createdCustomer) {
      // Clean the customer object before navigation
      const cleanCustomer = {
        ...createdCustomer,
        createdAt: createdCustomer.createdAt ? new Date(createdCustomer.createdAt).toISOString() : new Date().toISOString(),
        updatedAt: createdCustomer.updatedAt ? new Date(createdCustomer.updatedAt).toISOString() : null,
        notes: Array.isArray(createdCustomer.notes) ? [...createdCustomer.notes] : [],
      };
      navigation.navigate('Checkout', { customer: cleanCustomer });
    }
  }, [handleCloseModal, navigation]);

  return (
    <View style={styles.container}>
      <CustomerSearchBar
        value={search}
        onChangeText={setSearch}
        onClear={handleClearSearch}
        inputProps={{
          onFocus: () => setFocused(true),
          onBlur: () => {
            // Delay blur to allow item selection
            setTimeout(() => setFocused(false), 150);
          },
          onSubmitEditing: handleSubmit,
        }}
        inputRef={inputRef}
        rightButton={(
          <TouchableOpacity
            onPress={() => setShowCreateModal(true)}
            style={styles.addButton}
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
            onPress={handleClearSearch}
          />
          <View style={styles.overlayContainer}>
            {filtered.length > 0 ? (
              <FlatList
                data={filtered}
                keyExtractor={item => item._id || String(Math.random())}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    onPress={() => handleSelect(item)} 
                    style={styles.resultItem}
                  >
                    <Text style={styles.resultText}>
                      {item.lastName}, {item.firstName} <Text style={styles.resultPhone}>{item.phone}</Text>
                    </Text>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={!isLoading ? (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.noResults}>No customers found.</Text>
                  </View>
                ) : null}
                style={styles.resultsList}
              />
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.noResults}>No matching customers found.</Text>
                {showAddButton && (
                  <TouchableOpacity onPress={handleAddCustomer} style={styles.createButton}>
                    <Text style={styles.createButtonText}>Add New Customer</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </>
      )}
      
      <CustomerForm
        visible={showCreateModal}
        onClose={handleCloseModal}
        onSuccess={handleCustomerCreated}
        customer={preFillPhone ? { phone: preFillPhone } as Customer : undefined}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: '100%', 
    marginBottom: 16, 
    zIndex: 10,
  },
  addButton: {
    marginLeft: 8, 
    padding: 4,
  },
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
  resultsList: {
    maxHeight: Dimensions.get('window').height * 0.5,
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
  emptyContainer: {
    alignItems: 'center',
    padding: 20,
  },
  noResults: {
    padding: 16,
    color: '#888',
    textAlign: 'center',
  },
  createButton: {
    marginTop: 10,
    backgroundColor: '#007bff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
  },
  createButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
});

export default CustomerQuickSearch;