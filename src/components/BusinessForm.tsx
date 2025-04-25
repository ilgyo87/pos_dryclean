import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, TextInput } from 'react-native';
import { PhoneInput } from './PhoneInput';
import FormModal from './FormModal';
import CrudButtons from './CrudButtons';
import { useBusiness } from '../hooks/useBusiness';
import { useAuthenticator } from '@aws-amplify/ui-react-native';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import type { BusinessFormProps, BusinessFormState } from '../types';
import { useAvailability } from '../hooks/useAvailability';

const client = generateClient<Schema>();

const initialState: BusinessFormState = {
  businessName: '', 
  firstName: '', 
  lastName: '', 
  phone: '', 
  email: ''
};

export default function BusinessForm({ visible, onClose, onSuccess }: BusinessFormProps) {
  const [form, setForm] = useState(initialState);
  const { user: authUser } = useAuthenticator((context) => [context.user]);
  const { createBusiness, isLoading, error, refetch } = useBusiness({
    userId: authUser?.userId,
    authUser,
  });

  // Clear form when modal becomes visible
  useEffect(() => {
    if (visible) {
      setForm(initialState);
    }
  }, [visible]);

  useEffect(() => {
    if (error) {
      Alert.alert('Error', error);
    }
  }, [error]);

  const phoneAvailability = useAvailability(
    form.phone.replace(/\D/g, '').length >= 10 ? form.phone : '',
    async (val: string) => {
      try {
        const resp = await client.models.Business.list({ 
          filter: { phone: { eq: val } } 
        });
        return !!resp.data && resp.data.length > 0;
      } catch (err) {
        console.error('Phone check error:', err);
        return false; // Default to available on error
      }
    }
  );

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

      // Basic validation
      if (!form.businessName.trim()) {
        Alert.alert('Error', 'Business name is required');
        return;
      }

      if (!form.phone || form.phone.replace(/\D/g, '').length < 10) {
        Alert.alert('Error', 'Valid phone number is required');
        return;
      }

      if (!phoneAvailability.available) {
        Alert.alert('Error', 'Phone number is already in use');
        return;
      }

      // Create the business
      await createBusiness({
        ...form,
        userId: authUser.userId
      });

      // Force a refetch to update the dashboard
      await refetch(true);

      // Reset form and close modal
      handleReset();
      
      // Call the success callback if provided
      if (onSuccess) onSuccess();
      
      // Close the modal
      onClose();
      
      Alert.alert('Success', 'Business created successfully!');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create business');
    }
  };

  return (
    <FormModal visible={visible} onClose={onClose} title="Create Business">
      <View style={styles.form}>
        <Text style={styles.label}>Business Name<Text style={{ color: 'red' }}> *</Text></Text>
        <TextInput 
          placeholder="Business Name" 
          style={styles.input} 
          value={form.businessName} 
          onChangeText={(v: string) => handleChange('businessName', v)} 
        />
        
        <Text style={styles.label}>Phone<Text style={{ color: 'red' }}> *</Text></Text>
        <PhoneInput
          placeholder="Phone"
          style={styles.input}
          value={form.phone}
          onChangeText={v => handleChange('phone', v)}
          isAvailable={phoneAvailability.available}
          isLoading={phoneAvailability.loading}
          errorMessage={phoneAvailability.error}
        />
        
        <Text style={styles.label}>First Name</Text>
        <TextInput 
          placeholder="First Name" 
          style={styles.input} 
          value={form.firstName} 
          onChangeText={(v: string) => handleChange('firstName', v)} 
        />
        
        <Text style={styles.label}>Last Name</Text>
        <TextInput 
          placeholder="Last Name" 
          style={styles.input} 
          value={form.lastName} 
          onChangeText={(v: string) => handleChange('lastName', v)} 
        />
        
        <Text style={styles.requiredFields}>* Required fields</Text>
        
        <CrudButtons
          onCreate={handleCreate}
          onReset={handleReset}
          onCancel={onClose}
          isSubmitting={isLoading}
          showCreate
          showReset
          showCancel
          // Only disable the Create button (not Reset or Cancel)
          disabled={!form.businessName || !form.phone || !phoneAvailability.available}
        />
      </View>
    </FormModal>
  );
};

const styles = StyleSheet.create({
  form: { width: '100%' },
  label: { fontWeight: '600', marginBottom: 4, textTransform: 'capitalize' },
  input: { 
    borderWidth: 1, 
    borderColor: '#ccc', 
    borderRadius: 8, 
    padding: 10, 
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  requiredFields: {
    color: '#666',
    fontSize: 12,
    marginBottom: 12,
    textAlign: 'right',
  },
});