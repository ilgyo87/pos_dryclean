import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, TextInput } from 'react-native';
import { PhoneInput } from './PhoneInput';
import FormModal from './FormModal';
import CrudButtons from './CrudButtons';
import { useBusiness } from '../hooks/useBusiness';
import { useAuthenticator } from '@aws-amplify/ui-react-native';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';

// Amplify API client
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user: authUser } = useAuthenticator((context) => [context.user]);
  const { createBusiness } = useBusiness({
    userId: authUser?.userId,
    refresh: 0, // or a real refresh value if you use one
    authUser,
  });

  const handleChange = (field: keyof typeof initialState, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleReset = () => {
    setForm(initialState);
    setError(null);
  };

  const handleCreate = async () => {
    try {
      setLoading(true);
      setError(null);
      const userId = authUser?.userId;
      if (!userId) {
        setError('No user ID found.');
        return;
      }
      const formData = { ...form, userId };
      await createBusiness(formData);
      handleReset();
      if (onSuccess) {
        onSuccess(); // Triggers navigation in Navigation.tsx
      }
      onClose();
      Alert.alert('Success', 'Business created successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to create business.');
    } finally {
      setLoading(false);
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
          isSubmitting={loading}
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