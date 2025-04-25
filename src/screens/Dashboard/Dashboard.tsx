import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from "react-native";
import { useBusiness } from '../../hooks/useBusiness';
import { AuthUser } from "aws-amplify/auth";
import { useAuthenticator } from '@aws-amplify/ui-react-native';
import BusinessForm from '../../components/BusinessForm';
import CategoriesGrid from './CategoriesGrid';
import CustomerQuickSearch from './CustomerQuickSearch';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

export default function Dashboard({ user, refresh }: { user: AuthUser | null, refresh: number }) {
  const customerQuickSearchRef = useRef<{ focus: () => void }>(null);
  const mountedRef = useRef(true);
  const [showBusinessModal, setShowBusinessModal] = useState(false);
  const [localRefresh, setLocalRefresh] = useState(0);
  const { user: authUser } = useAuthenticator((context) => [context.user]);
  const navigation = useNavigation<any>();
  
  // Track initial render to prevent double-fetching
  const initialRenderRef = useRef(true);
  
  // Clean up on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Focus the search bar when the screen is focused
  useFocusEffect(
    React.useCallback(() => {
      // Short delay to ensure ref is ready
      const timer = setTimeout(() => {
        if (customerQuickSearchRef.current && mountedRef.current) {
          customerQuickSearchRef.current.focus();
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }, [])
  );

  // Get business data
  const { business, isLoading, error, refetch } = useBusiness({
    userId: user?.userId,
    refresh: localRefresh + (refresh || 0),
    authUser,
  });

  // Handle initial fetch
  useEffect(() => {
    if (initialRenderRef.current && user?.userId) {
      initialRenderRef.current = false;
      console.log('[Dashboard] Initial render, triggering business fetch');
      refetch(true);
    }
  }, [user?.userId, refetch]);

  // Handle business form success
  const handleBusinessFormSuccess = useCallback(() => {
    // Close the modal
    setShowBusinessModal(false);
    
    // Ensure we're still mounted before updating state
    if (mountedRef.current) {
      console.log('[Dashboard] Business created successfully, triggering refetch');
      
      // Trigger local refresh to force refetch
      setLocalRefresh(prev => prev + 1);
      
      // Immediate fetch with a short delay
      setTimeout(() => {
        if (mountedRef.current) {
          refetch(true);
        }
      }, 100);
    }
  }, [refetch]);

  // Show loading state only for the first load
  if (isLoading && !business && initialRenderRef.current) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {business ? (
        <>
          {/* Business info at the top */}
          <View style={styles.businessInfo}>
            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 4 }}>
              <Text style={[styles.businessName, { marginBottom: 0, marginRight: 12 }]}>{business.businessName}</Text>
              <Text style={[styles.businessDetail, { fontSize: 18, color: '#555' }]}>{business.phone}</Text>
            </View>
            {business.address ? (
              <Text style={styles.businessDetail}>{business.address}</Text>
            ) : null}
          </View>
          
          {/* Customer search component */}
          <CustomerQuickSearch ref={customerQuickSearchRef} />
          
          {/* Categories grid */}
          <CategoriesGrid
            categories={[
              {
                id: 'customers',
                title: 'Customers',
                count: 0,
                onPress: () => navigation.navigate('Customers'),
              },
              {
                id: 'orders',
                title: 'Orders',
                count: 0,
                onPress: () => navigation.navigate('Orders'),
              },
              {
                id: 'products',
                title: 'Products',
                count: 0,
                onPress: () => navigation.navigate('Products'),
              },
              {
                id: 'employees',
                title: 'Team',
                count: 0,
                onPress: () => navigation.navigate('Employees'),
              },
              {
                id: 'settings',
                title: 'Settings',
                count: 0,
                onPress: () => navigation.navigate('Settings'),
              },
              {
                id: 'reports',
                title: 'Reports',
                count: 0,
                onPress: () => navigation.navigate('Reports'),
              },
            ]}
          />
        </> 
      ) : (
        <View style={styles.noBusiness}>
          <Text style={styles.noBusinessText}>Business not created. Please create a business.</Text>
          <TouchableOpacity 
            onPress={() => setShowBusinessModal(true)}
            style={styles.createButtonContainer}
          >
            <Text style={styles.createButton}>Create Business</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* Business form modal */}
      <BusinessForm
        visible={showBusinessModal}
        onClose={() => setShowBusinessModal(false)}
        onSuccess={handleBusinessFormSuccess}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'flex-start',
    backgroundColor: '#f7f9fa',
  },
  businessInfo: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    minWidth: 300,
    maxWidth: 400,
  },
  businessName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 10,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  businessDetail: {
    fontSize: 16,
    color: '#444',
    marginBottom: 4,
    textAlign: 'center',
  },
  noBusiness: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  noBusinessText: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
  },
  createButtonContainer: {
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },
  createButton: {
    backgroundColor: '#007bff',
    color: 'white',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  }
});