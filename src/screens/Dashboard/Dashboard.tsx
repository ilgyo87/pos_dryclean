import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from "react-native";
import { useBusiness } from '../../hooks/useBusiness';
import { AuthUser } from "aws-amplify/auth";
import { useAuthenticator } from '@aws-amplify/ui-react-native';
import BusinessForm from '../../components/BusinessForm';
import CategoriesGrid from './CategoriesGrid';
import CustomerQuickSearch from './CustomerQuickSearch';
import { useNavigation } from '@react-navigation/native';

export default function Dashboard({ user, refresh }: { user: AuthUser | null, refresh: number }) {
  const [showBusinessModal, setShowBusinessModal] = useState(false);
  const { user: authUser } = useAuthenticator((context) => [context.user]);
  const navigation = useNavigation<any>();

  const { business, isLoading, error, refetch } = useBusiness({
    userId: user?.userId,
    refresh,
    authUser,
  });

  // Refetch business when refresh or user changes
  useEffect(() => {
    refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refresh, user?.userId]);

  if (isLoading) {
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
          <View style={styles.businessInfo}>
            <Text style={styles.businessName}>{business.businessName}</Text>
            <Text style={styles.businessDetail}>{business.address}</Text>
            <Text style={styles.businessDetail}>{business.phone}</Text>
          </View>
          <CustomerQuickSearch />
          <CategoriesGrid
            categories={[
              {
                id: 'customers',
                title: 'Customers',
                count: 0, // TODO: Replace with real count
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
        <View>
          <Text>Business not created. Please create a business.</Text>
          <TouchableOpacity onPress={() => setShowBusinessModal(true)}>
            <Text style={styles.createButton}>Create Business</Text>
          </TouchableOpacity>
          <BusinessForm
            visible={showBusinessModal}
            onClose={() => {
              setShowBusinessModal(false);
              setTimeout(refetch, 300); // Give modal time to close
            }}
            onSuccess={() => {
              setShowBusinessModal(false);
              setTimeout(refetch, 300); // Refetch after modal closes
            }}
          />
        </View>
      )}
    </View>
  );
}

import styles from './Dashboard.styles';