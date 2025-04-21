import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PhoneInput } from '../../../components/PhoneInput';
import { EmailInput } from '../../../components/EmailInput';

interface Props {
  phone: string;
  email: string;
  onChange: (field: 'phone' | 'email', value: string) => void;
  phoneCheckFn: (val: string) => Promise<boolean>;
  emailCheckFn: (val: string) => Promise<boolean>;
}

export const CustomerContactFields: React.FC<Props> = ({ phone, email, onChange, phoneCheckFn, emailCheckFn }) => (
  <>
    <Text style={styles.label}>Phone*</Text>
    <PhoneInput
      placeholder="Phone"
      style={styles.input}
      value={phone}
      onChangeText={v => onChange('phone', v)}
      checkFn={phoneCheckFn}
    />
    <Text style={styles.label}>Email</Text>
    <EmailInput
      placeholder="Email"
      style={styles.input}
      value={email}
      onChangeText={v => onChange('email', v)}
      checkFn={emailCheckFn}
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
