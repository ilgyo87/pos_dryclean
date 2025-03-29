import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert
} from 'react-native';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import * as QRCodeGenerator from '../utils/qrCodeGenerator';
import QRCode from 'react-native-qrcode-svg';
import { captureRef } from 'react-native-view-shot';
import { uploadData } from 'aws-amplify/storage';

// Initialize Amplify client
const client = generateClient<Schema>();

// Define props interface
interface CreateCustomerModalProps {
  visible: boolean;
  onClose: () => void;
  onCustomerCreated: (customerId: string, customerName: string) => void;
  businessId: string;
  initialData?: {
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
  };
}

const CreateCustomerModal = ({ 
  visible, 
  onClose, 
  onCustomerCreated,
  businessId,
  initialData = {}
}: CreateCustomerModalProps) => {
  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const [qrCodeRef, setQrCodeRef] = useState<React.RefObject<View>>(React.createRef());

  // Reset form when modal opens with potential initial data
  useEffect(() => {
    if (visible) {
      setFirstName(initialData.firstName || '');
      setLastName(initialData.lastName || '');
      setPhoneNumber(initialData.phoneNumber || '');
      setEmail('');
      setAddress('');
      setIsSubmitting(false);
      setIsGeneratingQR(false);
      setQrCodeRef(React.createRef());
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

  // Generate QR code for the customer
  const generateCustomerQRCode = async (customerId: string) => {
    try {
      setIsGeneratingQR(true);
      
      // Get the latest customer data
      const response = await client.models.Customer.get({ id: customerId });
      if (!response.data) throw new Error('Customer data not found');
      
      // Generate QR code data
      const qrData = QRCodeGenerator.generateQRCodeData('Customer', response.data);
      
      // Capture QR code SVG as an image
      if (!qrCodeRef.current) {
        throw new Error('QR code reference not available');
      }
      
      // Use react-native-view-shot to capture the QR code as an image
      const uri = await captureRef(qrCodeRef.current, {
        format: 'png',
        quality: 1
      });
      
      // Convert the image to a blob
      const imageResponse = await fetch(uri);
      const blob = await imageResponse.blob();
      
      // Save QR code to S3
      const result = await uploadData({
        path: `qrcodes/${businessId}/customer_${customerId}.png`,
        data: blob,
        options: {
          contentType: 'image/png'
        }
      }).result;
      
      // Update customer with QR code URL
      await client.models.Customer.update({
        id: customerId
      });
      
      console.log('QR code generated successfully:', result.path);
      return result.path;
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw error;
    } finally {
      setIsGeneratingQR(false);
    }
  };

  const handleCreateCustomer = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      // Create customer in database matching the schema
      const result = await client.models.Customer.create({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phoneNumber: phoneNumber.trim(),
        email: email.trim(), // Now required
        address: address.trim() || undefined,
        businessID: businessId
      });

      console.log('Customer created:', result);
      
      // Generate QR code for the new customer
      if (result.data && result.data.id) {
        try {
          await generateCustomerQRCode(result.data.id);
        } catch (qrError) {
          console.warn('Error generating QR code:', qrError);
          // Continue with customer creation even if QR code generation fails
        }
      }
      
      // Notify parent component and close modal
      if (result.data) {
        const fullName = `${firstName} ${lastName}`;
        onCustomerCreated(result.data.id, fullName);
        onClose();
      }
    } catch (error) {
      console.error('Error creating customer:', error);
      Alert.alert('Error', 'Failed to create customer. Please try again.');
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
            
            {/* Hidden QR code component for capturing */}
            <View style={styles.hiddenQrContainer}>
              <View ref={qrCodeRef} style={styles.qrCodeContainer}>
                <QRCode
                  value={JSON.stringify({
                    type: 'Customer',
                    firstName,
                    lastName,
                    email,
                    phoneNumber,
                    businessID: businessId
                  })}
                  size={200}
                  backgroundColor="white"
                  color="black"
                />
              </View>
            </View>
          </ScrollView>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
              disabled={isSubmitting || isGeneratingQR}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.createButton, (isSubmitting || isGeneratingQR) && styles.disabledButton]}
              onPress={handleCreateCustomer}
              disabled={isSubmitting || isGeneratingQR}
            >
              <Text style={styles.createButtonText}>
                {isSubmitting ? 'Creating...' : (isGeneratingQR ? 'Generating QR...' : 'Create Customer')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  modalView: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  scrollView: {
    width: '100%',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9fafb',
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
    marginRight: 8,
  },
  createButton: {
    backgroundColor: '#4f46e5',
    marginLeft: 8,
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4b5563',
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'white',
  },
  hiddenQrContainer: {
    position: 'absolute',
    left: -9999,
    height: 0,
    overflow: 'hidden',
  },
  qrCodeContainer: {
    backgroundColor: 'white',
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  }
});

export default CreateCustomerModal;