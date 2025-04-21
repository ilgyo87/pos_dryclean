import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from "react-native";
import { useBusiness } from '../../hooks/useBusiness';
import { useNavigation } from '@react-navigation/native';
import { AuthUser } from "aws-amplify/auth";
import { useAuthenticator } from '@aws-amplify/ui-react-native';

export default function Dashboard({ user, refresh }: { user: AuthUser | null, refresh: number }) {

  const navigation = useNavigation<any>();
  const { user: authUser } = useAuthenticator((context) => [context.user]);

  const { business, isLoading, error, refetch } = useBusiness({
    userId: user?.userId,
    refresh,
    authUser,
  });

  useEffect(() => {
    refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetch]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dashboard</Text>
      {business ? (
        <View>
          <Text style={styles.businessName}>{business.businessName}</Text>
          <Text>Address: {business.address}</Text>
          <Text>Phone: {business.phone}</Text>
          {/* categories */}
          {(() => {
            const counts = { customers: 0, orders: 0, products: 0, employees: 0 };
            const categories = [
              { id: 'customers', title: 'Customers', count: counts.customers },
              { id: 'orders', title: 'Orders', count: counts.orders },
              { id: 'products', title: 'Products', count: counts.products },
              { id: 'employees', title: 'Team', count: counts.employees },
            ];
            return categories.map(cat => <Text key={cat.id}>{cat.title}: {cat.count}</Text>);
          })()}
        </View>
      ) : (
        <View>
          <Text>Business not created. Please create a business.</Text>
          <TouchableOpacity onPress={() => navigation.navigate('CreateBusiness')}>
            <Text style={styles.createButton}>Create Business</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
  },
  businessName: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 8,
  },
  createButton: {
    backgroundColor: '#007bff',
    color: 'white',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    textAlign: 'center',
    alignSelf: 'center',
    marginTop: 10,
  }
});