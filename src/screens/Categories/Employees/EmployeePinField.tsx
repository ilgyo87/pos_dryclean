import React from 'react';
import { View, Text, StyleSheet, TextInput, ActivityIndicator } from 'react-native';

interface Props {
  pin: string;
  onChange: (field: 'pin', value: string) => void;
  isAvailable: boolean;
  isLoading: boolean;
  errorMessage?: string | null;
}

export const EmployeePinField: React.FC<Props> = ({ pin, onChange, isAvailable, isLoading, errorMessage }) => {
  return (
    <View style={{ marginBottom: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <TextInput
          value={pin}
          onChangeText={v => onChange('pin', v.replace(/\W/g, '').slice(0, 4))}
          style={[styles.input, !isAvailable && pin.length === 4 ? styles.inputError : undefined]}
          placeholder="4-char PIN"
          maxLength={4}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {isLoading && <ActivityIndicator size="small" style={{ marginLeft: 8 }} />}
        {pin.length === 4 && !isLoading && (
          isAvailable ? (
            <Text style={{ color: 'green', marginLeft: 8 }}>Available</Text>
          ) : (
            <Text style={{ color: 'red', marginLeft: 8 }}>Unavailable</Text>
          )
        )}
      </View>
      {errorMessage && <Text style={{ color: 'red', marginTop: 4 }}>{errorMessage}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  label: { fontWeight: '600', marginBottom: 4, textTransform: 'capitalize' },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 0,
    backgroundColor: '#fff',
    minWidth: 100,
    fontSize: 16,
  },
  inputError: {
    borderColor: 'red',
  },
});
