// src/components/EditCustomerModal.tsx
import React, { useState, useEffect } from 'react';
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
import type { Schema } from '../../amplify/data/resource';
import { styles } from '../styles/components/editCustomerModalStyles';
import QRCode from 'react-native-qrcode-svg';
import { generateQRCodeData, EntityType } from '../utils/qrCodeGenerator';

// Initialize Amplify client
const client = generateClient<Schema>();

interface Customer {
  id?: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  notes?: string;
  globalId?: string;
  businessID: string;
}

interface EditCustomerModalProps {
  visible: boolean;
  customerId?: string;
  businessId: string;
  isNewCustomer: boolean;
  onSave: (customerName: string) => void;
  onDelete: () => void;
  onClose: () => void;
  initialCustomerData?: Customer | null;
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
  const [customer, setCustomer] = useState<Customer>({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    notes: '',
    businessID: businessId,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [qrCodeString, setQrCodeString] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      if (isNewCustomer) {
        if (initialCustomerData) {
          setCustomer({
            ...initialCustomerData,
            businessID: businessId,
          });
        } else {
          setCustomer({
            firstName: '',
            lastName: '',
            phoneNumber: '',
            email: '',
            address: '',
            city: '',
            state: '',
            zipCode: '',
            notes: '',
            businessID: businessId,
          });
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
        setCustomer({
          id: response.data.id,
          firstName: response.data.firstName,
          lastName: response.data.lastName,
          phoneNumber: response.data.phoneNumber,
          email: response.data.email || '',
          address: response.data.address || '',
          city: response.data.city || '',
          state: response.data.state || '',
          zipCode: response.data.zipCode || '',
          notes: response.data.notes || '',
          globalId: response.data.globalId || '',
          businessID: response.data.businessID,
        });
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
      const qrDataInput = {
        id: customer.id,
        firstName: customer.firstName,
        lastName: customer.lastName,
        phoneNumber: customer.phoneNumber,
        businessID: customer.businessID,
      };

      if (
        qrDataInput.id &&
        qrDataInput.firstName &&
        qrDataInput.lastName &&
        qrDataInput.phoneNumber &&
        qrDataInput.businessID
      ) {
        const qrString = generateQRCodeData('Customer', qrDataInput);
        setQrCodeString(qrString);
      } else {
        setQrCodeString(null);
        console.warn('[EditCustomerModal] Missing data required for QR code generation.');
      }
    } else {
      setQrCodeString(null);
    }
  }, [customer]);

  const handleInputChange = (field: keyof Customer, value: string) => {
    setCustomer((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    if (!customer.firstName.trim() || !customer.lastName.trim() || !customer.phoneNumber.trim()) {
      Alert.alert('Required Fields', 'First name, last name, and phone number are required.');
      return;
    }

    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(customer.phoneNumber.replace(/\D/g, ''))) {
      Alert.alert('Invalid Phone Number', 'Please enter a valid 10-digit phone number');
      return;
    }

    if (!customer.email || !customer.email.trim()) {
      Alert.alert('Email Required', 'Please enter an email address');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customer.email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    setIsSaving(true);
    try {
      if (isNewCustomer) {
        const createInput: any = {
          firstName: customer.firstName,
          lastName: customer.lastName,
          phoneNumber: customer.phoneNumber,
          email: customer.email,
          businessID: businessId,
        };

        if (customer.address && customer.address.trim() !== '') createInput.address = customer.address;
        if (customer.city && customer.city.trim() !== '') createInput.city = customer.city;
        if (customer.state && customer.state.trim() !== '') createInput.state = customer.state;
        if (customer.zipCode && customer.zipCode.trim() !== '') createInput.zipCode = customer.zipCode;
        if (customer.notes && customer.notes.trim() !== '') createInput.notes = customer.notes;
        if (customer.globalId && customer.globalId.trim() !== '') createInput.globalId = customer.globalId;

        const result = await client.models.Customer.create(createInput);

        if (result.errors) {
          throw new Error(result.errors.map((e) => e.message).join(', '));
        }

        if (result.data && result.data.id) {
          const newCustomerId = result.data.id;
          const fullName = `${customer.firstName} ${customer.lastName}`;
          onSave(fullName);
        } else {
          throw new Error('Failed to get created customer ID');
        }
      } else if (customer.id) {
        const updateInput: any = {
          id: customer.id,
          firstName: customer.firstName,
          lastName: customer.lastName,
          phoneNumber: customer.phoneNumber,
          email: customer.email,
        };

        if (customer.address && customer.address.trim() !== '') updateInput.address = customer.address;
        if (customer.city && customer.city.trim() !== '') updateInput.city = customer.city;
        if (customer.state && customer.state.trim() !== '') updateInput.state = customer.state;
        if (customer.zipCode && customer.zipCode.trim() !== '') updateInput.zipCode = customer.zipCode;
        if (customer.notes && customer.notes.trim() !== '') updateInput.notes = customer.notes;

        const result = await client.models.Customer.update(updateInput);

        if (result.errors) {
          throw new Error(result.errors.map((e) => e.message).join(', '));
        }

        const fullName = `${customer.firstName} ${customer.lastName}`;
        onSave(fullName);
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

              onDelete();
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
                  value={customer.phoneNumber}
                  onChangeText={(text) => handleInputChange('phoneNumber', text)}
                  placeholder="Enter phone number"
                  keyboardType="phone-pad"
                />
              </View>

              {/* Email */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email *</Text>
                <TextInput
                  style={styles.textInput}
                  value={customer.email}
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
                  value={customer.address}
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
                    value={customer.city}
                    onChangeText={(text) => handleInputChange('city', text)}
                    placeholder="City"
                  />
                </View>

                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.inputLabel}>State</Text>
                  <TextInput
                    style={styles.textInput}
                    value={customer.state}
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
                    value={customer.zipCode}
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
                  value={customer.notes}
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