// src/screens/Dashboard/Dashboard.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useBusiness, resetBusinessRefetchState } from '../../hooks/useBusiness';
import { AuthUser } from "aws-amplify/auth";
import { useAuthenticator } from '@aws-amplify/ui-react-native';
import BusinessForm from '../../components/BusinessForm';
import CategoriesGrid from './CategoriesGrid';
import CustomerQuickSearch from './CustomerQuickSearch';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

export default function Dashboard({ 
  user, 
  refresh,
  employeeId,
  firstName,
  lastName 
}: { 
  user: AuthUser | null;
  refresh?: number;
  employeeId?: string;
  firstName?: string;
  lastName?: string;
}) {
  const [showBusinessModal, setShowBusinessModal] = useState(false);
  const [hasAutoOpenedModal, setHasAutoOpenedModal] = useState(false);
  const [localRefresh, setLocalRefresh] = useState(0);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const { user: authUser } = useAuthenticator((context) => [context.user]);
  const navigation = useNavigation<any>();
  const customerSearchRef = useRef<any>(null);
  
  // Get business data
  const { 
    business, 
    isLoading, 
    error, 
    refetch, 
    createBusiness 
  } = useBusiness({
    userId: user?.userId,
    refresh: localRefresh + (refresh || 0),
    authUser
  });

  // Log the component's mounting state
  useEffect(() => {
    console.log('[Dashboard] Component mounted');
    return () => {
      console.log('[Dashboard] Component unmounted');
    };
  }, []);

  // Log important state changes for debugging
  useEffect(() => {
    console.log('[Dashboard] State:', { 
      isLoading, 
      hasBusiness: !!business,
      error,
      showModal: showBusinessModal,
      isInitialLoad
    });
  }, [isLoading, business, error, showBusinessModal, isInitialLoad]);

  // Handle focus effect to refresh data when returning to this screen
  useFocusEffect(
    useCallback(() => {
      console.log('[Dashboard] Screen focused');
      
      // Don't refresh on first render, we'll do that in component mount
      if (!isInitialLoad) {
        console.log('[Dashboard] Screen refocused, triggering refresh');
        resetBusinessRefetchState();
        setLocalRefresh(prev => prev + 1);
      }
      
      return () => {
        console.log('[Dashboard] Screen unfocused');
      };
    }, [isInitialLoad])
  );

  // Set initial load to false after first render
  useEffect(() => {
    if (isInitialLoad && !isLoading) {
      console.log('[Dashboard] Initial load complete');
      setIsInitialLoad(false);
    }
  }, [isLoading, isInitialLoad]);

  // Auto-open business modal if no business exists
  useEffect(() => {
    // Only show the modal when we're sure no business exists AND we've completed loading
    if (!isLoading && !business && !hasAutoOpenedModal && !showBusinessModal) {
      console.log('[Dashboard] No business found, showing create form');
      setShowBusinessModal(true);
      setHasAutoOpenedModal(true);
    }
  }, [isLoading, business, hasAutoOpenedModal, showBusinessModal]);

  // Close business modal if business exists
  useEffect(() => {
    if (business && showBusinessModal) {
      console.log('[Dashboard] Business exists, closing modal');
      setShowBusinessModal(false);
    }
  }, [business, showBusinessModal]);

  // Handle business creation success
  const handleBusinessCreated = useCallback(() => {
    console.log('[Dashboard] Business created successfully');
    setShowBusinessModal(false);
    resetBusinessRefetchState();
    
    // Small delay to ensure UI is updated before refetching
    setTimeout(() => {
      setLocalRefresh(prev => prev + 1);
    }, 300);
  }, []);

  // Handle modal close without creating a business
  const handleCloseModal = useCallback(() => {
    console.log('[Dashboard] Modal closed without creating business');
    setShowBusinessModal(false);
  }, []);

  // Show proper loading state only during initial load
  if (isInitialLoad && isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  // Show create business screen if no business exists
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
          onClose={handleCloseModal}
          onSuccess={handleBusinessCreated}
        />
      </View>
    );
  }

  // Define dashboard categories
  const dashboardCategories = [
    { id: 'customers', title: 'Customers', count: 0, screen: 'Customers' },
    { id: 'orders', title: 'Orders', count: 0, screen: 'Orders' },
    { id: 'products', title: 'Products', count: 0, screen: 'Products' },
    { id: 'employees', title: 'Team', count: 0, screen: 'Employees' },
    { id: 'settings', title: 'Settings', count: 0, screen: 'Settings' },
    { id: 'reports', title: 'Reports', count: 0, screen: 'Reports' },
  ];

  // Show dashboard with business data
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.businessName}>{business.businessName}</Text>
        {employeeId && (
          <Text style={styles.employeeInfo}>
            Signed in as: {firstName} {lastName}
          </Text>
        )}
      </View>

      <CustomerQuickSearch ref={customerSearchRef} />

      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <CategoriesGrid
        categories={dashboardCategories}
        onSelectCategory={(category) => {
          if (category.screen === 'Products') {
            navigation.navigate('Products', { businessId: business._id });
          } else {
            navigation.navigate(category.screen);
          }
        }}
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
  employeeInfo: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
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