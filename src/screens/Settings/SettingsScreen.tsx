import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface SettingsScreenProps {
  employeeId?: string;
  firstName?: string;
  lastName?: string;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ employeeId, firstName, lastName }) => (
  <View style={styles.container}>
    <Text style={styles.title}>Settings</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: 'bold' },
});

export default SettingsScreen;
