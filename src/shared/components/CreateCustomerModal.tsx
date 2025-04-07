import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { generateClient } from 'aws-amplify/data';
import { styles } from '../styles/createCustomerModalStyles';
import type { Schema } from '../../../amplify/data/resource';
import QRCode from 'react-native-qrcode-svg';
import { 
  attachQRCodeKeyToEntity,
  generateQRCodeData,
} from './qrCodeGenerator';
import QRCodeCapture from './QRCodeCapture';

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // QR code states
  const [qrCodeString, setQrCodeString] = useState<string | null>(null);
  const [tempCustomer, setTempCustomer] = useState<Customer | null>(null);
  const [newCustomerId, setNewCustomerId] = useState<string | null>(null);
  const [qrCaptureVisible, setQrCaptureVisible] = useState(false);
  const [createdCustomer, setCreatedCustomer] = useState<Customer | null>(null);

  // Reset form when modal opens with potential initial data
  useEffect(() => {
    if (visible) {
      setFirstName(initialData.firstName || '');
      setLastName(initialData.lastName || '');
      setPhoneNumber(initialData.phoneNumber || '');
      setEmail(initialData.email || '');
      setIsSubmitting(false);
      setQrCodeString(null);
      setTempCustomer(null);
      setNewCustomerId(null);
      setQrCaptureVisible(false);
      setCreatedCustomer(null);
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
    
    if (!phoneNumber.trim()) {
      Alert.alert('Error', 'Phone number is required');
      return false;
    }
    
    // Basic email validation only if email is provided
    if (email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        Alert.alert('Error', 'Please enter a valid email address');
        return false;
      }
    }

    return true;
  };

  // Handle QR Code Complete
  const handleQrComplete = async (qrCodeKey: string | null) => {
    setQrCaptureVisible(false); // Hide scanner view

    if (!createdCustomer) {
      Alert.alert('Error', 'Customer data is missing');
      setIsSubmitting(false);
      return;
    }

    try {
      if (qrCodeKey) {
        console.log(`QR Code captured/uploaded for customer ${createdCustomer.id}. Attaching key: ${qrCodeKey}`);
        // Attach QR code key to customer record
        const success = await attachQRCodeKeyToEntity('Customer', createdCustomer.id, qrCodeKey);

        if (success) {
          console.log(`Successfully attached QR key to customer ${createdCustomer.id}`);
          // Update local customer object with QR code URL
          const updatedCustomer = { ...createdCustomer, qrCode: qrCodeKey };
          onCustomerCreated(updatedCustomer);
        } else {
          Alert.alert('Warning', 'Customer created, but failed to attach QR code');
          onCustomerCreated(createdCustomer);
        }
      } else {
        // User skipped QR code generation
        console.log('QR code generation skipped');
        onCustomerCreated(createdCustomer);
      }

      onClose(); // Close modal regardless
    } catch (error) {
      console.error('Error during QR attachment/handling:', error);
      Alert.alert('Error', 'Failed during QR step, but customer was created');
      onCustomerCreated(createdCustomer);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
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
        email: email.trim() || undefined, // Make email optional
        businessID: businessId,
        // Don't set qrCode yet - we'll update it after generating the QR code
      });
  
      if (result.data) {
        const customer = result.data;
        setCreatedCustomer(customer);
        setNewCustomerId(customer.id);
        
        // Show QR capture screen
        setQrCaptureVisible(true);
      } else {
        throw new Error('Failed to create customer record');
      }
    } catch (error) {
      console.error('Error creating customer:', error);
      Alert.alert('Error', 'There was a problem creating the customer. Please try again.');
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
          {qrCaptureVisible ? (
            // --- QR Scanner View ---
            <View style={{ flex: 1 }}>
              <Text style={styles.modalTitle}>Generating Customer QR Code</Text>
              {newCustomerId ? (
                <QRCodeCapture
                  value={newCustomerId}
                  entityType="Customer"
                  entityId={newCustomerId}
                  onCapture={handleQrComplete}
                  size={200}
                />
              ) : (
                <ActivityIndicator size="large" color="#4f46e5" />
              )}
              <Text style={{ textAlign: 'center', marginTop: 10, color: '#555' }}>
                Generating and saving QR code...
              </Text>
              <View style={{ marginTop: 15, alignItems: 'center' }}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton, { alignSelf: 'center' }]}
                  onPress={() => handleQrComplete(null)}
                  disabled={isSubmitting}
                >
                  <Text style={styles.cancelButtonText}>Skip QR Code</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            // --- Form View ---
            <>
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
                  <Text style={styles.label}>Phone Number *</Text>
                  <TextInput
                    style={styles.input}
                    value={phoneNumber}
                    onChangeText={formatPhoneNumber}
                    placeholder="(XXX) XXX-XXXX"
                    keyboardType="phone-pad"
                  />
                </View>
                
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Email</Text>
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="email@example.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
                
                {/* QR Code Preview - Always visible */}
                <View style={styles.qrCodeContainer}>
                  <Text style={styles.label}>Customer QR Code Preview</Text>
                  <View style={styles.qrCodeWrapper}>
                    {qrCodeString && tempCustomer ? (
                      <QRCode
                        value={qrCodeString}
                        size={150}
                        backgroundColor="white"
                        color="black"
                      />
                    ) : (
                      <View style={styles.emptyQrPlaceholder}>
                        <Text style={styles.emptyQrText}>Fill in customer details to generate QR code</Text>
                      </View>
                    )}
                  </View>
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
            </>
          )}

          {/* Loading Indicator - Rendered over everything else when active */}
          {isSubmitting && !qrCaptureVisible && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#fff" />
              <Text style={styles.loadingText}>Creating customer...</Text>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default CreateCustomerModal;