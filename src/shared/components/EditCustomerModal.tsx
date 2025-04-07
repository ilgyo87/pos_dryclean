// src/components/EditCustomerModal.tsx
import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';
import { styles } from '../styles/editCustomerModalStyles';
import QRCode from 'react-native-qrcode-svg';
import { generateQRCodeData } from './qrCodeGenerator';
import { LazyLoader } from '@aws-amplify/data-schema/dist/esm/runtime/client';


// Initialize Amplify client
const client = generateClient<Schema>();
type Customer = Schema['Customer']['type'];

interface EditCustomerModalProps {
  visible: boolean;
  customerId?: string;
  businessId: string;
  isNewCustomer: boolean;
  onSave: (customer: Customer) => Promise<void>;
  onDelete?: (customerId: string) => void;
  onClose: () => void;
  initialCustomerData?: Customer;
}

const EditCustomerModal: React.FC<EditCustomerModalProps> = ({
  visible,
  customerId,
  businessId,
  isNewCustomer,
  onSave,
  onDelete,
  onClose,
  initialCustomerData,
}) => {
  // Initialize customer state with default values for required fields
  const [customer, setCustomer] = useState<Customer>({
    ...initialCustomerData,
    id: initialCustomerData?.id || '',
    firstName: initialCustomerData?.firstName || '',
    lastName: initialCustomerData?.lastName || '',
    businessID: initialCustomerData?.businessID || businessId,
    // Handle required fields that might be missing
    orders: null,
    garments: null,
    transactions: null,
    notifications: null,
    credits: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  } as unknown as Customer);

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [qrCodeString, setQrCodeString] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      if (isNewCustomer) {
        if (initialCustomerData) {
          // Use the simpler approach for initializing from initialCustomerData
          setCustomer({
            ...initialCustomerData,
            businessID: businessId,
            // Handle required fields that might be missing
            orders: null,
            garments: null,
            transactions: null,
            notifications: null,
            credits: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          } as unknown as Customer);
        } else {
          // Simplified new customer initialization
          setCustomer({
            id: uuidv4(),
            firstName: '',
            lastName: '',
            phone: '',
            email: '',
            address: '',
            city: '',
            state: '',
            zipCode: '',
            notes: '',
            businessID: businessId,
            joinDate: new Date().toISOString(),
            qrCode: '',
            lastActiveDate: new Date().toISOString(),
            preferences: '',
            // Required fields
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            orders: null,
            garments: null,
            transactions: null,
            notifications: null,
            credits: null,
            cognitoUserId: ''
          } as unknown as Customer);
        }
      } else if (customerId) {
        fetchCustomerData();
      }
    }
  }, [visible, customerId, isNewCustomer, initialCustomerData]);

  const fetchCustomerData = async () => {
    if (!customerId) return;

    setIsLoading(true);
    try {
      const response = await client.models.Customer.get({ id: customerId });

      if (response.data) {
        // Simplified customer initialization from response data
        setCustomer({
          ...response.data,
          // Ensure optional fields have defaults
          phone: response.data.phone || '',
          email: response.data.email || '',
          address: response.data.address || '',
          city: response.data.city || '',
          state: response.data.state || '',
          zipCode: response.data.zipCode || '',
          notes: response.data.notes || '',
          qrCode: response.data.qrCode || '',
          lastActiveDate: response.data.lastActiveDate || new Date().toISOString(),
          preferences: response.data.preferences || '',
          cognitoUserId: response.data.cognitoUserId || '',
          // Ensure required fields are present
          createdAt: response.data.createdAt || new Date().toISOString(),
          updatedAt: response.data.updatedAt || new Date().toISOString(),
          // Ensure relationship fields exist
          orders: response.data.orders || null,
          garments: response.data.garments || null,
          transactions: response.data.transactions || null,
          notifications: response.data.notifications || null,
          credits: response.data.credits || null
        } as unknown as Customer);
      }
    } catch (error) {
      console.error('Error fetching customer data:', error);
      Alert.alert('Error', 'Failed to load customer data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (customer && customer.id) {
      // Check if all required fields are present and not empty
      if (
        customer.id &&
        customer.firstName &&
        customer.lastName &&
        customer.phone &&
        customer.businessID
      ) {
        const qrDataInput = {
          id: customer.id,
          firstName: customer.firstName,
          lastName: customer.lastName,
          phone: customer.phone,
          businessID: customer.businessID,
        };

        const qrString = generateQRCodeData('Customer', qrDataInput);
        setQrCodeString(qrString);
      } else {
        // Set QR code string to null if required data is missing
        setQrCodeString(null);
        console.log('Missing data required for QR code generation');
      }
    }
  }, [customer]);

  const handleInputChange = (field: keyof Customer, value: string) => {
    setCustomer((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    if (!customer.firstName.trim() || !customer.lastName.trim() || !customer.phone?.trim()) {
      Alert.alert('Required Fields', 'First name, last name, and phone number are required.');
      return;
    }

    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(customer.phone.replace(/\D/g, ''))) {
      Alert.alert('Invalid Phone Number', 'Please enter a valid 10-digit phone number');
      return;
    }

    if (!customer.email || !customer.email.trim()) {
      Alert.alert('Email Required', 'Please enter an email address');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customer.email.trim())) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    setIsSaving(true);
    try {
      // Format the joinDate properly - ensure it's a valid ISO string
      const formattedCustomer = {
        ...customer,
        updatedAt: new Date().toISOString()
      };

      if (isNewCustomer) {
        // Create new customer
        const createInput = {
          firstName: formattedCustomer.firstName.trim(),
          lastName: formattedCustomer.lastName.trim(),
          phone: formattedCustomer.phone?.replace(/\D/g, '') || '',
          email: formattedCustomer.email?.trim().toLowerCase() || '',
          businessID: formattedCustomer.businessID,
        };
        const result = await client.models.Customer.create(createInput);

        if (result.errors) {
          throw new Error(result.errors.map((e) => e.message).join(', '));
        }

        onSave(formattedCustomer);
      } else {
        // Update existing customer
        const updateInput = {
          id: formattedCustomer.id,
          firstName: formattedCustomer.firstName.trim(),
          lastName: formattedCustomer.lastName.trim(),
          phone: formattedCustomer.phone?.replace(/\D/g, '') || '',
          email: formattedCustomer.email?.trim().toLowerCase() || '',
          updatedAt: formattedCustomer.updatedAt,
        };
        const result = await client.models.Customer.update(updateInput);

        if (result.errors) {
          throw new Error(result.errors.map((e) => e.message).join(', '));
        }

        onSave(formattedCustomer);
      }
    } catch (error) {
      console.error('Error saving customer:', error);
      Alert.alert('Error', 'Failed to save customer. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!customer.id) return;

    Alert.alert(
      'Delete Customer',
      `Are you sure you want to delete ${customer.firstName} ${customer.lastName}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              const result = await client.models.Customer.delete({
                id: customer.id || '',
              });

              if (result.errors) {
                throw new Error(result.errors.map((e) => e.message).join(', '));
              }

              onDelete?.(customer.id);
            } catch (error) {
              console.error('Error deleting customer:', error);
              Alert.alert('Error', 'Failed to delete customer. Please try again.');
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalContainer}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {isNewCustomer ? 'New Customer' : 'Edit Customer'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2196F3" />
              <Text style={styles.loadingText}>Loading customer data...</Text>
            </View>
          ) : (
            <ScrollView style={styles.formScrollView}>
              {/* First Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>First Name *</Text>
                <TextInput
                  style={styles.textInput}
                  value={customer.firstName}
                  onChangeText={(text) => handleInputChange('firstName', text)}
                  placeholder="Enter first name"
                />
              </View>

              {/* Last Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Last Name *</Text>
                <TextInput
                  style={styles.textInput}
                  value={customer.lastName}
                  onChangeText={(text) => handleInputChange('lastName', text)}
                  placeholder="Enter last name"
                />
              </View>

              {/* Phone Number */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Phone Number *</Text>
                <TextInput
                  style={styles.textInput}
                  value={customer.phone || ''}
                  onChangeText={(text) => handleInputChange('phone', text)}
                  placeholder="Enter phone number"
                  keyboardType="phone-pad"
                />
              </View>

              {/* Email */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email *</Text>
                <TextInput
                  style={styles.textInput}
                  value={customer.email || ''}
                  onChangeText={(text) => handleInputChange('email', text)}
                  placeholder="Enter email address"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              {/* Address */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Address</Text>
                <TextInput
                  style={styles.textInput}
                  value={customer.address || ''}
                  onChangeText={(text) => handleInputChange('address', text)}
                  placeholder="Enter street address"
                />
              </View>

              {/* City, State, Zip in one row */}
              <View style={styles.rowInputContainer}>
                <View style={[styles.inputGroup, { flex: 2, marginRight: 8 }]}>
                  <Text style={styles.inputLabel}>City</Text>
                  <TextInput
                    style={styles.textInput}
                    value={customer.city || ''}
                    onChangeText={(text) => handleInputChange('city', text)}
                    placeholder="City"
                  />
                </View>

                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.inputLabel}>State</Text>
                  <TextInput
                    style={styles.textInput}
                    value={customer.state || ''}
                    onChangeText={(text) => handleInputChange('state', text)}
                    placeholder="State"
                    maxLength={2}
                    autoCapitalize="characters"
                  />
                </View>

                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>ZIP</Text>
                  <TextInput
                    style={styles.textInput}
                    value={customer.zipCode || ''}
                    onChangeText={(text) => handleInputChange('zipCode', text)}
                    placeholder="Zip"
                    keyboardType="number-pad"
                    maxLength={5}
                  />
                </View>
              </View>

              {/* Notes */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Notes</Text>
                <TextInput
                  style={[styles.textInput, styles.multilineInput]}
                  value={customer.notes || ''}
                  onChangeText={(text) => handleInputChange('notes', text)}
                  placeholder="Add notes about this customer"
                  multiline
                  numberOfLines={4}
                />
              </View>

              {/* QR Code Display */}
              {qrCodeString ? (
                <View style={styles.qrCodeContainer}>
                  <Text style={styles.inputLabel}>QR Code</Text>
                  <View style={styles.qrCodeWrapper}>
                    <QRCode
                      value={qrCodeString}
                      size={150}
                      backgroundColor="white"
                      color="black"
                    />
                  </View>
                </View>
              ) : null}

              {/* Button Row */}
              <View style={styles.buttonRow}>
                {!isNewCustomer && (
                  <TouchableOpacity
                    style={[styles.button, styles.deleteButton]}
                    onPress={handleDelete}
                    disabled={isDeleting}
                  >
                    <Text style={styles.buttonText}>
                      {isDeleting ? 'Deleting...' : 'Delete'}
                    </Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[styles.button, styles.saveButton, isNewCustomer ? { flex: 1 } : {}]}
                  onPress={handleSave}
                  disabled={isSaving}
                >
                  <Text style={styles.buttonText}>
                    {isSaving ? 'Saving...' : 'Save'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default EditCustomerModal;