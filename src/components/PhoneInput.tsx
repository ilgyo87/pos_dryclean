import React, { useState, useEffect } from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps } from 'react-native';

interface PhoneInputProps extends TextInputProps {
  value: string;
  onChangeText: (text: string) => void;
  // Instead of passing the check function, pass the availability state directly
  isAvailable: boolean;
  isLoading: boolean;
  errorMessage: string | null;
}

export const PhoneInput: React.FC<PhoneInputProps> = ({
  value,
  onChangeText,
  isAvailable,
  isLoading,
  errorMessage,
  style,
  ...rest
}) => {
  const [formattedValue, setFormattedValue] = useState(value);
  const [focused, setFocused] = useState(false);
  
  // Normalize phone for validation
  const normalizedPhone = value.replace(/\D/g, '');
  const isValid = normalizedPhone.length >= 10;
  
  // Format phone number as user types
  useEffect(() => {
    const formatPhoneNumber = (phone: string) => {
      const digits = phone.replace(/\D/g, '');
      
      if (digits.length === 0) {
        return '';
      } else if (digits.length <= 3) {
        return `(${digits}`;
      } else if (digits.length <= 6) {
        return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
      } else {
        return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
      }
    };
    
    setFormattedValue(formatPhoneNumber(value));
  }, [value]);
  
  // Handle text change with formatting
  const handleChangeText = (text: string) => {
    // Extract only digits and forward to parent
    const digitsOnly = text.replace(/\D/g, '');
    
    // Limit to 10 digits
    if (digitsOnly.length <= 10) {
      onChangeText(text);
    }
  };
  
  return (
    <View>
      <TextInput
        value={formattedValue}
        onChangeText={handleChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        keyboardType="phone-pad"
        style={style}
        maxLength={14} // (xxx) xxx-xxxx
        {...rest}
      />
      
      {isLoading && normalizedPhone.length >= 10 && focused && (
        <Text style={styles.helper}>Checking availability...</Text>
      )}
      
      {!isLoading && !isAvailable && normalizedPhone.length >= 10 && (
        <Text style={styles.inputError}>{errorMessage || 'Phone number already in use'}</Text>
      )}
      
      {!isLoading && isAvailable && normalizedPhone.length >= 10 && (
        <Text style={styles.available}>Available</Text>
      )}
      
      {!isValid && value !== '' && !focused && (
        <Text style={styles.inputError}>Phone number must have 10 digits</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  helper: { color: '#666', marginBottom: 4 },
  inputError: { color: '#E53935', marginBottom: 10 },
  available: { color: '#28a745', marginBottom: 10 },
});