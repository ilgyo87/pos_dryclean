import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const ReportsScreen = () => (
  <View style={styles.container}>
    <Text style={styles.title}>Reports</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: 'bold' },
});

export default ReportsScreen;
