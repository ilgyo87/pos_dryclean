import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps } from 'react-native';

interface EmailInputProps extends TextInputProps {
  value: string;
  onChangeText: (text: string) => void;
  // Instead of passing the check function, pass the availability state directly
  isAvailable: boolean;
  isLoading: boolean;
  errorMessage: string | null;
}

export const EmailInput: React.FC<EmailInputProps> = ({
  value,
  onChangeText,
  isAvailable,
  isLoading,
  errorMessage,
  style,
  ...rest
}) => {
  const [focused, setFocused] = useState(false);
  
  // Check if email format is valid
  const isValidFormat = value === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  
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
      
      {isLoading && value !== '' && focused && (
        <Text style={styles.helper}>Checking availability...</Text>
      )}
      
      {!isLoading && !isAvailable && value !== '' && (
        <Text style={styles.inputError}>{errorMessage || 'Email already in use'}</Text>
      )}
      
      {!isLoading && isAvailable && value !== '' && isValidFormat && (
        <Text style={styles.available}>Available</Text>
      )}
      
      {!isValidFormat && value !== '' && (
        <Text style={styles.inputError}>Please enter a valid email</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  helper: { color: '#666', marginBottom: 4 },
  inputError: { color: '#E53935', marginBottom: 10 },
  available: { color: '#28a745', marginBottom: 10 },
});