import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import type { Customer } from '../../types';

// Route params type for navigation
interface CheckoutScreenRouteParams {
  customer: Customer;
}

type CheckoutScreenRouteProp = RouteProp<{ Checkout: CheckoutScreenRouteParams }, 'Checkout'>;

interface CheckoutScreenProps {
  employeeId?: string;
  firstName?: string;
  lastName?: string;
}

const CheckoutScreen: React.FC<CheckoutScreenProps> = ({ employeeId, firstName, lastName }) => {
  const route = useRoute<CheckoutScreenRouteProp>();
  const { customer } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Checkout for {customer.firstName} {customer.lastName}</Text>
      <Text style={styles.label}>Phone: <Text style={styles.value}>{customer.phone}</Text></Text>
      <Text style={styles.label}>Email: <Text style={styles.value}>{customer.email || 'N/A'}</Text></Text>
      <Text style={styles.label}>Address: <Text style={styles.value}>{customer.address || 'N/A'}</Text></Text>
      {/* Add more customer info and checkout actions here */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 10,
  },
  value: {
    fontWeight: '400',
    color: '#333',
  },
});

export default CheckoutScreen;
