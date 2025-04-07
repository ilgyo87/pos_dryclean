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
  Alert
} from 'react-native';
import { generateClient } from 'aws-amplify/data';
import { styles } from '../styles/createCustomerModalStyles';
import type { Schema } from '../../../amplify/data/resource';
import { Customer } from '../types/CustomerTypes';
import {
  generateQRCodeData,
  attachQRCodeKeyToEntity
} from './qrCodeGenerator';
import QRCodeCapture from './QRCodeCapture';

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
    phone?: string;
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
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newCustomerId, setNewCustomerId] = useState<string | null>(null);
  const [qrCodeData, setQRCodeData] = useState<string | null>(null);
  const [showQRCapture, setShowQRCapture] = useState(false);

  // Reset form when modal opens with potential initial data
  useEffect(() => {
    if (visible) {
      setFirstName(initialData.firstName || '');
      setLastName(initialData.lastName || '');
      setPhone(initialData.phone || '');
      setEmail(initialData.email || '');
      setAddress('');
      setIsSubmitting(false);
      setNewCustomerId(null);
      setQRCodeData(null);
      setShowQRCapture(false);
    }
  }, [visible, initialData]);

  // Validate form inputs
  const validateForm = () => {
    if (!firstName.trim()) {
      Alert.alert('Error', 'First name is required');
      return false;
    }
    if (!lastName.trim()) {
      Alert.alert('Error', 'Last name is required');
      return false;
    }
    if (!phone.trim()) {
      Alert.alert('Error', 'Phone number is required');
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
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim() || undefined,
        businessID: businessId,
      });

      const customer = result.data;
      console.log('Customer created:', customer);

      // Generate QR code data
      const qrData = generateQRCodeData('Customer', {
        id: customer?.id || '',
        name: `${customer?.firstName} ${customer?.lastName}` || '',
        phone: customer?.phone || ''
      });

      // Set the state to show QR code capture
      setQRCodeData(qrData);
      setNewCustomerId(customer?.id || '');
      setShowQRCapture(true);

      // The QR code process will continue with onQRCodeCaptured once the QR code is captured
    } catch (error) {
      console.error('Error creating customer:', error);
      Alert.alert('Error', 'There was a problem creating the customer. Please try again.');
      setIsSubmitting(false);
    }
  };

  // Handle QR code capture completion
  const handleQRCodeCaptured = async (qrCodeUrl: string) => {
    try {
      if (newCustomerId) {
        // Update the customer record with the QR code URL
        await attachQRCodeKeyToEntity('Customer', newCustomerId, qrCodeUrl);

        // Create full customer object to return
        const customer: Customer = {
          id: newCustomerId,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone.trim(),
          email: email.trim(),
          address: address.trim() || undefined,
          businessID: businessId,
          qrCode: qrCodeUrl,
          joinDate: new Date().toISOString(),
        };

        // Notify parent component and close modal
        onCustomerCreated(customer);
        onClose();
      }
    } catch (error) {
      console.error('Error attaching QR code:', error);
      Alert.alert('Warning', 'Customer created but QR code attachment failed.');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Modal
        visible={visible && !showQRCapture}
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
                  value={phone}
                  onChangeText={setPhone}
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

      {/* QR Code Capture Modal */}
      {showQRCapture && (
        <QRCodeCapture
          value={qrCodeData || ''} // Use 'value' instead of 'data'
          entityType="Customer"
          entityId={newCustomerId || ''}
          onCapture={handleQRCodeCaptured}
        />
      )}
    </>
  );
};

export default CreateCustomerModal;