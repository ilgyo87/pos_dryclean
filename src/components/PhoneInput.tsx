import React, { useEffect, useState } from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps } from 'react-native';
import { useAvailability } from '../hooks/useAvailability';

interface PhoneInputProps extends TextInputProps {
  value: string;
  onChangeText: (text: string) => void;
  checkFn: (val: string) => Promise<boolean>;
}

export const PhoneInput: React.FC<PhoneInputProps> = ({
  value,
  onChangeText,
  checkFn,
  style,
  ...rest
}) => {
  // Only trigger check when 10+ characters
  const checkValue = value.replace(/\D/g, '').length >= 10 ? value : '';
  const [focused, setFocused] = useState(false);
  const { available, loading, error } = useAvailability(checkValue, checkFn);
  return (
    <View>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        keyboardType="phone-pad"
        style={style}
        {...rest}
      />
      {loading && checkValue !== '' && focused && <Text style={styles.helper}>Checking availability...</Text>}
      {!loading && !available && <Text style={styles.inputError}>{error || 'Value unavailable'}</Text>}
      {!loading && available && checkValue !== '' && <Text style={styles.available}>Available</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  helper: { color: '#666', marginBottom: 4 },
  inputError: { color: '#E53935', marginBottom: 10 },
  available: { color: '#28a745', marginBottom: 10 },
});
