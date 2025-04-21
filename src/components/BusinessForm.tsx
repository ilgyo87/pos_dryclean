// Simplified BusinessForm.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, TextInput } from 'react-native';
import { PhoneInput } from './PhoneInput';
import FormModal from './FormModal';
import CrudButtons from './CrudButtons';
import { useBusiness } from '../hooks/useBusiness';
import { useAuthenticator } from '@aws-amplify/ui-react-native';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';

const client = generateClient<Schema>();

interface BusinessFormProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const initialState = {
  businessName: '', firstName: '', lastName: '', phone: '', email: ''
};

export default function BusinessForm({ visible, onClose, onSuccess }: BusinessFormProps) {
  const [form, setForm] = useState(initialState);
  const { user: authUser } = useAuthenticator((context) => [context.user]);
  
  // Use the hook with minimized parameters
  const { createBusiness, isLoading, error } = useBusiness({
    userId: authUser?.userId,
    authUser,
  });

  const handleChange = (field: keyof typeof initialState, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleReset = () => {
    setForm(initialState);
  };

  const handleCreate = async () => {
    try {
      if (!authUser?.userId) {
        Alert.alert('Error', 'No user ID found.');
        return;
      }
      
      // Let the hook handle all the business creation logic
      await createBusiness({
        ...form,
        userId: authUser.userId
      });
      
      handleReset();
      if (onSuccess) onSuccess();
      onClose();
      Alert.alert('Success', 'Business created successfully!');
    } catch (err: any) {
      // Error is already handled by the hook
      console.log('Error in form:', err);
    }
  };

  return (
    <FormModal visible={visible} onClose={onClose} title="Create Business">
      <View style={styles.form}>
        <Text style={styles.label}>Business Name</Text>
        <TextInput placeholder="Business Name" style={styles.input} value={form.businessName} onChangeText={(v: string) => handleChange('businessName', v)} />
        <Text style={styles.label}>Phone</Text>
        <PhoneInput
          placeholder="Phone"
          style={styles.input}
          value={form.phone}
          onChangeText={v => handleChange('phone', v)}
          checkFn={async val => {
            const resp = await client.models.Business.list({ filter: { phone: { eq: val } } });
            return !!resp.data && resp.data.length > 0;
          }}
        />
        <Text style={styles.label}>First Name</Text>
        <TextInput placeholder="First Name" style={styles.input} value={form.firstName} onChangeText={(v: string) => handleChange('firstName', v)} />
        <Text style={styles.label}>Last Name</Text>
        <TextInput placeholder="Last Name" style={styles.input} value={form.lastName} onChangeText={(v: string) => handleChange('lastName', v)} />
        <CrudButtons
          onCreate={handleCreate}
          onReset={handleReset}
          onCancel={onClose}
          isSubmitting={isLoading}
          error={error}
          showCreate
          showReset
          showCancel
        />
      </View>
    </FormModal>
  );
};

const styles = StyleSheet.create({
  form: { width: '100%' },
  label: { fontWeight: '600', marginBottom: 4, textTransform: 'capitalize' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, marginBottom: 10 },
});