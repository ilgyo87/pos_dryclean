// src/screens/Dashboard/Dashboard.tsx
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { AuthUser } from "aws-amplify/auth";
import { useAuthenticator } from '@aws-amplify/ui-react-native';
import CategoriesGrid from './CategoriesGrid';
import CustomerQuickSearch from './CustomerQuickSearch';
import { useNavigation } from '@react-navigation/native';

export default function Dashboard({ 
  user, 
  refresh,
  business,
  employeeId,
  firstName,
  lastName 
}: { 
  user: AuthUser | null;
  refresh?: number;
  business?: any;
  employeeId?: string;
  firstName?: string;
  lastName?: string;
}) {
  const { user: authUser } = useAuthenticator((context) => [context.user]);
  const navigation = useNavigation<any>();
  
  useEffect(() => {
    console.log('[Dashboard] Received business:', business?.businessName);
  }, [business]);

  // If business is undefined or missing both id and _id, return an empty view
  if (!business || !(business._id || business.id)) {
    return null;
  }

  // Dashboard categories for the grid
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

      <CustomerQuickSearch />

      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <CategoriesGrid
        categories={dashboardCategories}
        onSelectCategory={(category) => {
          if (category.screen === 'Products') {
            navigation.navigate('Products', { businessId: business._id || business.id });
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
  }
});