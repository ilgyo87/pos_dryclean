// src/components/BusinessForm.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Alert, TextInput } from 'react-native';
import { PhoneInput } from './PhoneInput';
import FormModal from './FormModal';
import CrudButtons from './CrudButtons';
import { useBusiness, resetBusinessRefetchState } from '../hooks/useBusiness';
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
  const [submitting, setSubmitting] = useState(false);
  const { user: authUser } = useAuthenticator((context) => [context.user]);
  
  // Only use createBusiness from useBusiness hook
  const { createBusiness, error } = useBusiness({
    userId: authUser?.userId,
    authUser,
  });

  // Set initial email from user when modal becomes visible
  useEffect(() => {
    if (visible && authUser) {
      // Use the user's email from Cognito if available
      const userEmail = authUser.signInDetails?.loginId || '';
      
      console.log('[BusinessForm] Setting initial email from user:', userEmail);
      
      setForm(prev => ({
        ...prev,
        email: userEmail
      }));
    }
  }, [visible, authUser]);

  // Clear form when modal becomes visible (except for email)
  useEffect(() => {
    if (visible) {
      setForm(prev => ({
        ...initialState,
        email: prev.email // Preserve email
      }));
      setSubmitting(false);
    }
  }, [visible]);

  // Show error alerts
  useEffect(() => {
    if (error) {
      Alert.alert('Error', error);
    }
  }, [error]);

  // Check if phone number is available
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

  // Email validation
  const isValidEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Handle form field changes
  const handleChange = (field: keyof typeof initialState, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  // Reset form to initial state but preserve email
  const handleReset = useCallback(() => {
    setForm(prev => ({
      ...initialState,
      email: prev.email // Preserve email
    }));
  }, []);

  // Validate the entire form
  const validateForm = (): boolean => {
    // Check required fields
    if (!form.businessName.trim()) {
      Alert.alert('Error', 'Business name is required');
      return false;
    }

    if (!form.phone || form.phone.replace(/\D/g, '').length < 10) {
      Alert.alert('Error', 'Valid phone number is required');
      return false;
    }

    if (!phoneAvailability.available) {
      Alert.alert('Error', 'Phone number is already in use');
      return false;
    }

    if (!form.email.trim()) {
      Alert.alert('Error', 'Email is required');
      return false;
    }

    if (!isValidEmail(form.email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }

    return true;
  };

  // Handle business creation
  const handleCreate = useCallback(async () => {
    try {
      if (!authUser?.userId) {
        Alert.alert('Error', 'No user ID found.');
        return;
      }

      // Validate the form first
      if (!validateForm()) {
        return;
      }

      setSubmitting(true);

      // Log data being sent
      console.log('[BusinessForm] Creating business with data:', {
        businessName: form.businessName,
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        email: form.email,
        userId: authUser.userId
      });

      // Create the business
      const response = await createBusiness({
        businessName: form.businessName,
        firstName: form.firstName || '',
        lastName: form.lastName || '',
        phone: form.phone,
        email: form.email,
        userId: authUser.userId
      });

      console.log('[BusinessForm] Business creation response:', response);

      // Reset form
      handleReset();
      
      // Only call onSuccess if there are no errors
      if (!response.errors) {
        // Success, show alert first so user sees it
        Alert.alert(
          'Success', 
          'Business created successfully!',
          [
            { 
              text: 'OK', 
              onPress: () => {
                console.log('[BusinessForm] Success alert confirmed');
                
                // IMPORTANT: We call onSuccess after user clicks OK on alert
                // This ensures they see the success message before UI changes
                if (onSuccess) {
                  console.log('[BusinessForm] Calling onSuccess callback');
                  onSuccess();
                } else {
                  onClose();
                }
              }
            }
          ]
        );
      } else {
        // Handle GraphQL errors
        const errorMessage = response.errors?.[0]?.message || 'Failed to create business';
        throw new Error(errorMessage);
      }
    } catch (err: any) {
      console.error('[BusinessForm] Error creating business:', err);
      Alert.alert('Error', err.message || 'Failed to create business');
    } finally {
      setSubmitting(false);
    }
  }, [authUser, form, handleReset, createBusiness, phoneAvailability.available, onClose, onSuccess]);

  // Handle cancellation
  const handleCancel = useCallback(() => {
    // Reset form
    handleReset();
    
    // Close the modal
    onClose();
  }, [handleReset, onClose]);

  return (
    <FormModal visible={visible} onClose={handleCancel} title="Create Business">
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
          onCancel={handleCancel}
          isSubmitting={submitting}
          showCreate
          showReset
          showCancel
          // Only disable the Create button (not Reset or Cancel)
          disabled={!isFormValid()}
        />
      </View>
    </FormModal>
  );

  // Function to check if form is valid for enabling/disabling the Create button
  function isFormValid(): boolean {
    return (
      !!form.businessName.trim() &&
      form.phone.replace(/\D/g, '').length >= 10 &&
      phoneAvailability.available &&
      !!form.email.trim() &&
      isValidEmail(form.email)
    );
  }
};

const styles = StyleSheet.create({
  form: {
    width: '100%'
  },
  label: {
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'capitalize'
  },
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