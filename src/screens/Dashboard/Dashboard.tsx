// src/screens/Dashboard/Dashboard.tsx - Updated version with fixes for dashboard loading issues

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useBusiness, resetBusinessRefetchState } from '../../hooks/useBusiness';
import { AuthUser } from "aws-amplify/auth";
import { useAuthenticator } from '@aws-amplify/ui-react-native';
import BusinessForm from '../../components/BusinessForm';
import CategoriesGrid from './CategoriesGrid';
import CustomerQuickSearch from './CustomerQuickSearch';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

export default function Dashboard({ user, refresh }: { user: AuthUser | null, refresh?: number }) {
  const [showBusinessModal, setShowBusinessModal] = useState(false);
  const [hasAutoOpenedModal, setHasAutoOpenedModal] = useState(false);
  const [localRefresh, setLocalRefresh] = useState(0);
  const { user: authUser } = useAuthenticator((context) => [context.user]);
  const navigation = useNavigation<any>();
  
  // Track initial render to prevent double-fetching
  const initialRenderRef = useRef(true);
  
  // Track if dashboard is currently focused
  const isFocusedRef = useRef(false);

  // Get business data with forceRefreshOnMount set to true
  const { business, isLoading, error, refetch } = useBusiness({
    userId: user?.userId,
    refresh: localRefresh + (refresh || 0),
    authUser,
    forceRefreshOnMount: true // Use the new parameter to force refresh on mount
  });

  // Reset refetch state and force refresh when dashboard gains focus
  useFocusEffect(
    useCallback(() => {
      console.log('[Dashboard] Screen focused');
      isFocusedRef.current = true;
      
      // Reset the global refetch state to ensure we can fetch
      resetBusinessRefetchState();
      
      // Force a refresh when returning to this screen
      if (!initialRenderRef.current) {
        console.log('[Dashboard] Not initial render, triggering refresh');
        setLocalRefresh(prev => prev + 1);
      }
      
      return () => {
        console.log('[Dashboard] Screen unfocused');
        isFocusedRef.current = false;
      };
    }, [])
  );

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
    
    // Reset the global refetch state
    resetBusinessRefetchState();
    
    // Force a refresh with a small delay to ensure dashboard is visible
    setTimeout(() => {
      console.log('[Dashboard] Business form success, triggering refresh');
      setLocalRefresh(prev => prev + 1);
    }, 300);
  }, []);

  // Only auto-open business modal once on first load with no business
  useEffect(() => {
    if (!isLoading && !business && !showBusinessModal && !hasAutoOpenedModal) {
      setShowBusinessModal(true);
      setHasAutoOpenedModal(true);
    }
  }, [isLoading, business, showBusinessModal, hasAutoOpenedModal]);

  // Automatically close business modal if a business is present
  useEffect(() => {
    if (business && showBusinessModal) {
      setShowBusinessModal(false);
    }
  }, [business, showBusinessModal]);

  // Debug log for render state
  console.log('[Dashboard] Render', { isLoading, business });

  // Show loading spinner only on first load before modal auto-open
  if (!business && isLoading && !hasAutoOpenedModal) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  // If no business, show create business screen
  if (!business) {
    return (
      <View style={styles.noBusiness}>
        <Text style={styles.noBusinessTitle}>Welcome to POS Dryclean!</Text>
        <Text style={styles.noBusinessText}>
          To get started, please create a business profile.
        </Text>
        {!showBusinessModal && (
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => setShowBusinessModal(true)}
          >
            <Text style={styles.createButtonText}>Create Business</Text>
          </TouchableOpacity>
        )}

        <BusinessForm
          visible={showBusinessModal}
          onClose={() => {
            setShowBusinessModal(false);
            // Reset refetch state only; do NOT force a refetch on cancel
            resetBusinessRefetchState();
          }}
          onSuccess={handleBusinessFormSuccess}
        />
      </View>
    );
  }

  // Define dashboard categories for quick actions grid
  const dashboardCategories = [
    { id: 'customers', title: 'Customers', count: 0, screen: 'Customers' },
    { id: 'orders', title: 'Orders', count: 0, screen: 'Orders' },
    { id: 'products', title: 'Products', count: 0, screen: 'Products' },
    { id: 'employees', title: 'Team', count: 0, screen: 'Employees' },
    { id: 'settings', title: 'Settings', count: 0, screen: 'Settings' },
    { id: 'reports', title: 'Reports', count: 0, screen: 'Reports' },
  ];

  // If we have a business, show the dashboard
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.businessName}>{business.businessName}</Text>
      </View>

      <CustomerQuickSearch />

      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <CategoriesGrid
        categories={dashboardCategories}
        onSelectCategory={(category: any) => navigation.navigate(category.screen)}
      />

      <BusinessForm
        visible={showBusinessModal}
        onClose={() => {
          setShowBusinessModal(false);
          // Reset refetch state and force refresh when modal is closed
          resetBusinessRefetchState();
          setTimeout(() => refetch(true), 300);
        }}
        onSuccess={handleBusinessFormSuccess}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    marginBottom: 20,
  },
  businessName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 10,
    color: '#333',
  },
  noBusiness: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  noBusinessTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
    textAlign: 'center',
  },
  noBusinessText: {
    fontSize: 16,
    marginBottom: 30,
    color: '#666',
    textAlign: 'center',
  },
  createButton: {
    backgroundColor: '#007bff',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
