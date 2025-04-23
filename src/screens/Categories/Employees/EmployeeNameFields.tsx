import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';

interface Props {
  firstName: string;
  lastName: string;
  onChange: (field: 'firstName' | 'lastName', value: string) => void;
}

export const EmployeeNameFields: React.FC<Props> = ({ firstName, lastName, onChange }) => (
  <>
    <Text style={styles.label}>First Name *</Text>
    <TextInput
      placeholder="First Name"
      style={styles.input}
      value={firstName}
      onChangeText={v => onChange('firstName', v)}
      autoCapitalize="words"
    />
    <Text style={styles.label}>Last Name *</Text>
    <TextInput
      placeholder="Last Name"
      style={styles.input}
      value={lastName}
      onChangeText={v => onChange('lastName', v)}
      autoCapitalize="words"
    />
  </>
);

const styles = StyleSheet.create({
  label: { fontWeight: '600', marginBottom: 4, textTransform: 'capitalize' },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
});
