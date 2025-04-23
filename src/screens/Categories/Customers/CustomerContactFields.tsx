import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PhoneInput } from '../../../components/PhoneInput';
import { EmailInput } from '../../../components/EmailInput';

interface Props {
  phone: string;
  email: string;
  onChange: (field: 'phone' | 'email', value: string) => void;
  phoneCheckFn: (val: string) => Promise<boolean>;
  emailCheckFn: (val: string) => Promise<boolean>;
  onPhoneError?: (err: string | null) => void;
}

export const CustomerContactFields: React.FC<Props> = ({ 
  phone, 
  email, 
  onChange, 
  phoneCheckFn, 
  emailCheckFn, 
  onPhoneError
}) => {
  // State for phone availability
  const [phoneAvailable, setPhoneAvailable] = useState(true);
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  // Notify parent of phone error
  useEffect(() => {
    if (onPhoneError) onPhoneError(phoneError);
  }, [phoneError, onPhoneError]);
  
  // State for email availability
  const [emailAvailable, setEmailAvailable] = useState(true);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  
  // Check phone availability
  useEffect(() => {
    let active = true;
    const normalizedPhone = phone.replace(/\D/g, '');
    
    if (normalizedPhone.length >= 10) {
      setPhoneLoading(true);
      setPhoneError(null);
      
      phoneCheckFn(normalizedPhone)
        .then(exists => {
          if (active) {
            setPhoneAvailable(!exists);
            setPhoneError(exists ? 'Phone number already in use' : null);
          }
        })
        .catch(err => {
          if (active) {
            setPhoneAvailable(false);
            setPhoneError(err.message || 'Error checking availability');
          }
        })
        .finally(() => {
          if (active) {
            setPhoneLoading(false);
          }
        });
    } else {
      setPhoneAvailable(true);
      setPhoneLoading(false);
      setPhoneError(null);
    }
    
    return () => {
      active = false;
    };
  }, [phone, phoneCheckFn]);
  
  // Check email availability
  useEffect(() => {
    let active = true;
    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    
    if (email && isValidEmail) {
      setEmailLoading(true);
      setEmailError(null);
      
      emailCheckFn(email)
        .then(exists => {
          if (active) {
            setEmailAvailable(!exists);
          }
        })
        .catch(err => {
          if (active) {
            setEmailAvailable(false);
            setEmailError(err.message || 'Error checking availability');
          }
        })
        .finally(() => {
          if (active) {
            setEmailLoading(false);
          }
        });
    } else {
      setEmailAvailable(true);
      setEmailLoading(false);
      setEmailError(null);
    }
    
    return () => {
      active = false;
    };
  }, [email, emailCheckFn]);
  
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
      <Text style={styles.label}>Email</Text>
      <EmailInput
        placeholder="Email"
        style={styles.input}
        value={email}
        onChangeText={v => onChange('email', v)}
        isAvailable={emailAvailable}
        isLoading={emailLoading}
        errorMessage={emailError}
      />
    </>
  );
};

const styles = StyleSheet.create({
  label: { 
    fontWeight: '600', 
    marginBottom: 4, 
    textTransform: 'capitalize' 
  },
  required: {
    color: '#E53935',
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
});