import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, TextInput } from 'react-native';
import { PhoneInput } from './PhoneInput';
import FormModal from './FormModal';
import CrudButtons from './CrudButtons';
import { useBusiness } from '../hooks/useBusiness';
import { v4 as uuidv4 } from 'uuid';
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
  businessName: '', firstName: '', lastName: '', address: '', city: '', state: '', zipCode: '', phone: '', email: '', website: ''
};

import { useAuthenticator } from '@aws-amplify/ui-react-native';

const BusinessForm: React.FC<BusinessFormProps> = ({ visible, onClose, onSuccess }) => {
  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { createBusiness } = useBusiness();
  const { user } = useAuthenticator((context) => [context.user]);

  const handleChange = (field: keyof typeof initialState, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleReset = () => {
    setForm(initialState);
    setError(null);
  };

  const handleCreate = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!user?.userId) throw new Error('No userId found');
      await createBusiness({ ...form, userId: user.userId });
      handleReset();
      onClose();
      onSuccess?.();
      Alert.alert('Success', 'Business created successfully!');
    } catch (e: any) {
      setError(e.message || 'Failed to create business');
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

export default BusinessForm;