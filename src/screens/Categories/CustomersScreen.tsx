import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const CustomersScreen = () => (
  <View style={styles.container}>
    <Text style={styles.title}>Customers</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: 'bold' },
});

export default CustomersScreen;
