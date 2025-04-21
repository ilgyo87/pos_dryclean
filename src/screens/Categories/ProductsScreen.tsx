import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const ProductsScreen = () => (
  <View style={styles.container}>
    <Text style={styles.title}>Products</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: 'bold' },
});

export default ProductsScreen;
