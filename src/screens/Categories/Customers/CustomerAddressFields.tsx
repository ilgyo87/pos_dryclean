import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';

interface Props {
  address: string;
  city: string;
  state: string;
  zipCode: string;
  onChange: (field: 'address' | 'city' | 'state' | 'zipCode', value: string) => void;
}

export const CustomerAddressFields: React.FC<Props> = ({ address, city, state, zipCode, onChange }) => (
  <>
    <Text style={styles.label}>Address</Text>
    <TextInput
      placeholder="Address"
      style={styles.input}
      value={address}
      onChangeText={v => onChange('address', v)}
    />
    <View style={styles.row}>
      <View style={styles.cityContainer}>
        <Text style={styles.label}>City</Text>
        <TextInput
          placeholder="City"
          style={styles.input}
          value={city}
          onChangeText={v => onChange('city', v)}
        />
      </View>
      <View style={styles.stateContainer}>
        <Text style={styles.label}>State</Text>
        <TextInput
          placeholder="State"
          style={styles.input}
          value={state}
          onChangeText={v => onChange('state', v)}
          maxLength={2}
          autoCapitalize="characters"
        />
      </View>
      <View style={styles.zipContainer}>
        <Text style={styles.label}>Zip Code</Text>
        <TextInput
          placeholder="Zip Code"
          style={styles.input}
          value={zipCode}
          onChangeText={v => onChange('zipCode', v)}
          keyboardType="number-pad"
          maxLength={5}
        />
      </View>
    </View>
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
