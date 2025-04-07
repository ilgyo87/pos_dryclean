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
import { styles } from '../styles/createCustomerModalStyles';
import type { Schema } from '../../../amplify/data/resource';
import QRCode from 'react-native-qrcode-svg';
import { 
  attachQRCodeKeyToEntity,
  generateQRCodeData,
} from './qrCodeGenerator';
// Initialize Amplify client
const client = generateClient<Schema>();
type Customer = Schema['Customer']['type'];

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
  
  // New state for QR code generation
  const [qrCodeString, setQrCodeString] = useState<string | null>(null);
  const [tempCustomer, setTempCustomer] = useState<Customer | null>(null);

  // Reset form when modal opens with potential initial data
  useEffect(() => {
    if (visible) {
      setFirstName(initialData.firstName || '');
      setLastName(initialData.lastName || '');
      setPhoneNumber(initialData.phoneNumber || '');
      setEmail(initialData.email || '');
      setAddress('');
      setIsSubmitting(false);
      setQrCodeString(null);
      setTempCustomer(null);
    }
  }, [visible, initialData]);

  // Generate QR code data for preview when customer info is ready
  useEffect(() => {
    // Only generate QR data if we have the minimum required fields
    if (firstName && lastName && businessId) {
      // Create a temporary customer object for QR code generation
      const tempCustomerData = {
        id: 'temp-id', // Will be replaced with actual ID after creation
        firstName,
        lastName,
        phone: phoneNumber,
        email,
        businessID: businessId,
      };
      
      setTempCustomer(tempCustomerData as Customer);

      // Generate QR code data string
      const qrData = generateQRCodeData('Customer', tempCustomerData);
      setQrCodeString(qrData);
    } else {
      setQrCodeString(null);
    }
  }, [firstName, lastName, phoneNumber, email, businessId]);

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
        phone: phoneNumber.trim(),
        email: email.trim(),
        address: address.trim() || undefined,
        businessID: businessId,
        // Don't set qrCode yet - we'll update it after generating the QR code
      });
  
      if (result.data) {
        // Generate and upload QR code using the newly created customer data
        const customer = result.data;
        
        // Use the generateQRCodeData function to create and store QR code
        const qrCodeUrl = await generateQRCodeData('Customer', {
          id: customer.id,
          firstName: customer.firstName,
          lastName: customer.lastName,
          phone: customer.phone || '',
          email: customer.email,
          businessID: customer.businessID
        });
        
        if (qrCodeUrl) {
          // Update the customer record with the QR code URL
          await attachQRCodeKeyToEntity('Customer', customer.id, qrCodeUrl);
          
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
            
            {/* QR Code Preview */}
            {qrCodeString && tempCustomer && (
              <View style={styles.qrCodeContainer}>
                <Text style={styles.label}>Customer QR Code Preview</Text>
                <View style={styles.qrCodeWrapper}>
                  <QRCode
                    value={qrCodeString}
                    size={150}
                    backgroundColor="white"
                    color="black"
                  />
                </View>
              </View>
            )}
            
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