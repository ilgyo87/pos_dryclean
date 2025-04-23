import React from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';

interface Props {
  address: string;
  city: string;
  state: string;
  zipCode: string;
  onChange: (field: 'address' | 'city' | 'state' | 'zipCode', value: string) => void;
}

export const EmployeeAddressFields: React.FC<Props> = ({ address, city, state, zipCode, onChange }) => {
  return (
    <>
      <Text style={styles.label}>Address</Text>
      <TextInput
        value={address}
        onChangeText={v => onChange('address', v)}
        style={styles.input}
        placeholder="Address"
      />
      <View style={styles.row}>
        <View style={styles.cityContainer}>
          <Text style={styles.label}>City</Text>
          <TextInput
            value={city}
            onChangeText={v => onChange('city', v)}
            style={styles.input}
            placeholder="City"
          />
        </View>
        <View style={styles.stateContainer}>
          <Text style={styles.label}>State</Text>
          <TextInput
            value={state}
            onChangeText={v => onChange('state', v)}
            style={styles.input}
            placeholder="State"
          />
        </View>
        <View style={styles.zipContainer}>
          <Text style={styles.label}>Zip Code</Text>
          <TextInput
            value={zipCode}
            onChangeText={v => onChange('zipCode', v.replace(/\D/g, '').slice(0, 10))}
            style={styles.input}
            placeholder="Zip Code"
            keyboardType="numeric"
          />
        </View>
      </View>
    </>
  );
};

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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cityContainer: {
    flex: 3,
    marginRight: 8,
  },
  stateContainer: {
    flex: 1,
    marginHorizontal: 4,
  },
  zipContainer: {
    flex: 2,
    marginLeft: 8,
  },
});
