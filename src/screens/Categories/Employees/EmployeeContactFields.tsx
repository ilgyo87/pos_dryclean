import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PhoneInput } from '../../../components/PhoneInput';

interface Props {
  phone: string;
  onChange: (field: 'phone', value: string) => void;
  phoneCheckFn: (val: string) => Promise<boolean>;
}

export const EmployeeContactFields: React.FC<Props> = ({ phone, onChange, phoneCheckFn }) => {
  const [phoneAvailable, setPhoneAvailable] = React.useState(true);
  const [phoneLoading, setPhoneLoading] = React.useState(false);
  const [phoneError, setPhoneError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;
    const normalizedPhone = phone.replace(/\D/g, '');
    if (normalizedPhone.length >= 10) {
      setPhoneLoading(true);
      setPhoneError(null);
      phoneCheckFn(normalizedPhone)
        .then(exists => {
          if (active) setPhoneAvailable(!exists);
        })
        .catch(err => {
          if (active) {
            setPhoneAvailable(false);
            setPhoneError(err.message || 'Error checking availability');
          }
        })
        .finally(() => {
          if (active) setPhoneLoading(false);
        });
    } else {
      setPhoneAvailable(true);
      setPhoneLoading(false);
      setPhoneError(null);
    }
    return () => { active = false; };
  }, [phone, phoneCheckFn]);

  return (
    <>
      <Text style={styles.label}>Phone<Text style={styles.required}>*</Text></Text>
      <PhoneInput
        placeholder="Phone"
        style={styles.input}
        value={phone}
        onChangeText={v => onChange('phone', v)}
        isAvailable={phoneAvailable}
        isLoading={phoneLoading}
        errorMessage={phoneError}
      />
    </>
  );
};

const styles = StyleSheet.create({
  label: { fontWeight: '600', marginBottom: 4, textTransform: 'capitalize' },
  required: { color: '#E53935', fontWeight: 'bold' },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
});
