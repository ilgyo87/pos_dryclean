import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert
} from 'react-native';
import { generateClient } from 'aws-amplify/data';
import { styles } from '../styles/components/createCustomerModalStyles';
import type { Schema } from '../../amplify/data/resource';
import { Customer } from '../types/CustomerTypes';
import { 
  generateAndUploadQRCode, 
  attachQRCodeToEntity 
} from '../utils/qrCodeGenerator';

// Initialize Amplify client
const client = generateClient<Schema>();

// Define props interface
interface CreateCustomerModalProps {
  visible: boolean;
  onClose: () => void;
  onCustomerCreated: (customer: Customer) => void;
  businessId: string;
  searchGlobalCustomers?: (phone: string) => Promise<Customer[]>;
  initialData?: {
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    email?: string;
  };
}

const CreateCustomerModal = ({ 
  visible, 
  onClose, 
  onCustomerCreated,
  businessId,
  searchGlobalCustomers = async () => [],
  initialData = {}
}: CreateCustomerModalProps) => {
  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal opens with potential initial data
  useEffect(() => {
    if (visible) {
      setFirstName(initialData.firstName || '');
      setLastName(initialData.lastName || '');
      setPhoneNumber(initialData.phoneNumber || '');
      setEmail('');
      setAddress('');
      setIsSubmitting(false);
    }
  }, [visible, initialData]);

  // Format phone number as user types (e.g., (123) 456-7890)
  const formatPhoneNumber = (text: string) => {
    // Remove all non-digit characters
    const cleaned = text.replace(/\D/g, '');
    
    // Format the phone number
    let formatted = ``;
    if (cleaned.length <= 3) {
      formatted = cleaned;
    } else if (cleaned.length <= 6) {
      formatted = `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    } else {
      formatted = `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
    }
    
    setPhoneNumber(formatted);
  };

  const validateForm = () => {
    if (!firstName.trim()) {
      Alert.alert('Error', 'First name is required');
      return false;
    }
    
    if (!lastName.trim()) {
      Alert.alert('Error', 'Last name is required');
      return false;
    }
    
    // New validation for email
    if (!email.trim()) {
      Alert.alert('Error', 'Email is required');
      return false;
    }
    
    // Basic email validation using regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }

    return true;
  };

  // Handle customer creation
  const handleCreateCustomer = async () => {
    if (!validateForm()) return;
  
    setIsSubmitting(true);
    try {
      // First create the customer in database
      const result = await client.models.Customer.create({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phoneNumber: phoneNumber.trim(),
        email: email.trim(),
        address: address.trim() || undefined,
        businessID: businessId,
        preferredContactMethod: email ? 'EMAIL' : 'PHONE', // Choose based on provided data
        // Don't set qrCode yet - we'll update it after generating the QR code
      });
  
      if (result.data) {
        // Generate and upload QR code using the newly created customer data
        const customer = result.data;
        
        // Use the generateAndUploadQRCode function to create and store QR code
        const qrCodeUrl = await generateAndUploadQRCode('Customer', {
          id: customer.id,
          firstName: customer.firstName,
          lastName: customer.lastName,
          phoneNumber: customer.phoneNumber,
          email: customer.email,
          businessID: customer.businessID
        });
        
        if (qrCodeUrl) {
          // Update the customer record with the QR code URL
          await attachQRCodeToEntity('Customer', customer.id, qrCodeUrl);
          
          // Update the local customer object with QR code URL
          customer.qrCode = qrCodeUrl;
        }
        
        // Notify parent component and close modal
        onCustomerCreated(customer);
        onClose();
      }
    } catch (error) {
      console.error('Error creating customer:', error);
      Alert.alert('Error', 'There was a problem creating the customer. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.centeredView}
      >
        <View style={styles.modalView}>
          <Text style={styles.modalTitle}>Create New Customer</Text>
          
          <ScrollView style={styles.scrollView}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>First Name *</Text>
              <TextInput
                style={styles.input}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="First Name"
                autoCapitalize="words"
                autoFocus
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Last Name *</Text>
              <TextInput
                style={styles.input}
                value={lastName}
                onChangeText={setLastName}
                placeholder="Last Name"
                autoCapitalize="words"
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={styles.input}
                value={phoneNumber}
                onChangeText={formatPhoneNumber}
                placeholder="(XXX) XXX-XXXX"
                keyboardType="phone-pad"
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Email *</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="email@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Address</Text>
              <TextInput
                style={[styles.input, styles.multilineInput]}
                value={address}
                onChangeText={setAddress}
                placeholder="Street, City, State, ZIP"
                multiline
              />
            </View>
            
          </ScrollView>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
              disabled={isSubmitting}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.createButton, isSubmitting && styles.disabledButton]}
              onPress={handleCreateCustomer}
              disabled={isSubmitting}
            >
              <Text style={styles.createButtonText}>
                {isSubmitting ? 'Creating...' : 'Create Customer'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default CreateCustomerModal;