import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const OrdersScreen = ({ employeeId, firstName, lastName, ...rest }: { employeeId?: string; firstName?: string; lastName?: string; [key: string]: any }) => (
  <View style={styles.container}>
    <Text style={styles.title}>Orders</Text>
    <Text style={{ marginTop: 16, fontSize: 16, color: '#555' }}>
      Employee ID: {employeeId || 'No employeeId'}
    </Text>
    <Text style={{ marginTop: 4, fontSize: 16, color: '#555' }}>
      Name: {firstName || '-'} {lastName || '-'}
    </Text>
    <Text style={{ marginTop: 8, fontSize: 12, color: '#888' }}>
      Debug: {JSON.stringify({ employeeId, firstName, lastName, ...rest })}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: 'bold' },
});

export default OrdersScreen;
