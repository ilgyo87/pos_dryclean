import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps } from 'react-native';
import { useAvailability } from '../hooks/useAvailability';

interface EmailInputProps extends TextInputProps {
  value: string;
  onChangeText: (text: string) => void;
  checkFn: (val: string) => Promise<boolean>;
}

export const EmailInput: React.FC<EmailInputProps> = ({
  value,
  onChangeText,
  checkFn,
  style,
  ...rest
}) => {
  // Only trigger check when value looks like an email
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  const checkValue = isValidEmail ? value : '';
  const [focused, setFocused] = useState(false);
  const { available, loading, error } = useAvailability(checkValue, checkFn);
  
  return (
    <View>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        keyboardType="email-address"
        autoCapitalize="none"
        style={style}
        {...rest}
      />
      {loading && checkValue !== '' && focused && <Text style={styles.helper}>Checking availability...</Text>}
      {!loading && !available && <Text style={styles.inputError}>{error || 'Email unavailable'}</Text>}
      {!loading && available && checkValue !== '' && <Text style={styles.available}>Available</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  helper: { color: '#666', marginBottom: 4 },
  inputError: { color: '#E53935', marginBottom: 10 },
  available: { color: '#28a745', marginBottom: 10 },
});