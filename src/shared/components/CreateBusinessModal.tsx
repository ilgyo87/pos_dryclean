// src/components/CreateBusinessModal.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Platform
} from 'react-native';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';
import { useAuthenticator } from '@aws-amplify/ui-react-native';
import { seedBusinessData } from './seedData'; 
import QRCodeCapture from './QRCodeCapture'; 
import { attachQRCodeKeyToEntity } from './qrCodeGenerator'; 
import { styles } from '../styles/createBusinessStyles'; 
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'; 

const client = generateClient<Schema>();

interface CreateBusinessModalProps {
  isVisible: boolean;
  onCancel: () => void;
  onBusinessCreated: (businessId: string, businessName: string) => void;
}

const CreateBusinessModal: React.FC<CreateBusinessModalProps> = ({ isVisible, onCancel, onBusinessCreated }) => {
  const [businessName, setBusinessName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [isCheckingPhone, setIsCheckingPhone] = useState(false);
  const [phoneExists, setPhoneExists] = useState(false);
  const [phoneCheckComplete, setPhoneCheckComplete] = useState(false);
  const [qrCaptureVisible, setQrCaptureVisible] = useState(false); // State to control QR view
  const [newBusinessId, setNewBusinessId] = useState<string | null>(null); // Store ID for QR step

  const { user } = useAuthenticator((context) => [context.user]);
  const ownerId = user?.userId;

  // Debounce function
  const debounce = (func: (...args: any[]) => void, delay: number) => {
    let timeoutId: NodeJS.Timeout | null = null;
    return (...args: any[]) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        func(...args);
      }, delay);
    };
  };

  const resetForm = () => {
    setBusinessName('');
    setFirstName('');
    setLastName('');
    setPhoneNumber('');
    setAddress('');
    setCity('');
    setState('');
    setZipCode('');
    setIsLoading(false);
    setIsFormValid(false);
    setIsCheckingPhone(false);
    setPhoneExists(false);
    setPhoneCheckComplete(false);
    setQrCaptureVisible(false);
    setNewBusinessId(null);
  };

  // Validate all form fields on change
  useEffect(() => {
    setIsFormValid(
      !!businessName.trim() &&
      !!firstName.trim() &&
      !!lastName.trim() &&
      !!phoneNumber.trim() &&
      !phoneExists && // Must not exist
      phoneCheckComplete // Phone check must be done
      // Add other mandatory field checks if needed
    );
  }, [businessName, firstName, lastName, phoneNumber, phoneExists, phoneCheckComplete]);

  // Phone number existence check (debounced)
  const checkPhoneNumberExists = useCallback(
    debounce(async (phone: string) => {
      if (!phone || phone.length < 10) { // Basic check
        setIsCheckingPhone(false);
        setPhoneExists(false);
        setPhoneCheckComplete(false);
        return;
      }
      setIsCheckingPhone(true);
      setPhoneCheckComplete(false);
      setPhoneExists(false); // Reset on new check
      try {
        // Assuming a 'listBusinesses' query with a filter on phoneNumber
        const { data: businesses } = await client.models.Business.list({
          filter: {
            phoneNumber: { eq: phone }
          }
        });
        const exists = businesses.length > 0;
        setPhoneExists(exists);
      } catch (error) {
        console.error('Error checking phone number:', error);
        // Decide how to handle API errors - maybe allow proceeding?
        setPhoneExists(false);
      } finally {
        setIsCheckingPhone(false);
        setPhoneCheckComplete(true);
      }
    }, 1000), // 1 second debounce delay
    []
  );

  const handlePhoneChange = (text: string) => {
    // Basic formatting/cleaning can go here if needed
    const cleaned = text.replace(/\D/g, ''); // Remove non-digits
    setPhoneNumber(cleaned); // Store cleaned number
    setPhoneExists(false); // Reset validation state on change
    setPhoneCheckComplete(false);
    checkPhoneNumberExists(cleaned); // Trigger debounced check
  };

  // --- Handle Business Creation ---
  const handleCreateBusiness = async () => {
    if (!ownerId) {
      Alert.alert('Error', 'User not authenticated.');
      return;
    }
    if (!isFormValid || isCheckingPhone || phoneExists) {
      Alert.alert('Validation Error', 'Please ensure all required fields are filled correctly and the phone number is valid and unique.');
      return;
    }

    setIsLoading(true); // START loading
    try {
      const newBusinessInput = {
        name: businessName,
        firstName: firstName,
        lastName: lastName,
        phoneNumber: phoneNumber, // Use cleaned number
        // address: address || undefined, // Use undefined if empty
        // city: city || undefined,
        // state: state || undefined,
        // zipCode: zipCode || undefined,
        userId: ownerId
      };

      console.log("Attempting to create business with input:", newBusinessInput);
      const result = await client.models.Business.create(newBusinessInput);
      console.log("Business creation result:", result);

      if (result.data && result.data.id) {
        console.log("Business created, starting seeding:", result.data.id);
        await seedBusinessData(result.data.id); // Seed initial data
        console.log("Data seeding complete for:", result.data.id);

        setNewBusinessId(result.data.id); // Store ID for QR step
        setQrCaptureVisible(true); // Show QR scanner view
        // DO NOT set isLoading(false) here. Let QR flow handle it.

      } else {
        console.error('Failed to create business or result missing ID:', result.errors);
        throw new Error(`Failed to create business: ${result.errors?.map(e => e.message).join(', ')}`);
      }
    } catch (error: any) {
      console.error('Error creating business:', error);
      Alert.alert('Error', `Could not create business: ${error.message || 'Unknown error'}`);
      setIsLoading(false); // STOP loading on error
    }
    // REMOVED finally block that manipulated isLoading
  };

  // --- Handle QR Code Completion (after scan or skip) ---
  const handleQrComplete = async (qrCodeKey: string | null) => {
    const createdBusinessId = newBusinessId;
    const createdBusinessName = businessName; // Capture before resetting

    setIsLoading(true); // Indicate QR processing
    setQrCaptureVisible(false); // Hide scanner view regardless of outcome

    try {
      if (qrCodeKey && createdBusinessId) {
        console.log(`QR Code captured/uploaded for business ${createdBusinessId}. Attaching key: ${qrCodeKey}`);
        // Assuming attachQRCodeKeyToEntity returns a boolean success status
        const success = await attachQRCodeKeyToEntity('Business', createdBusinessId, qrCodeKey);

        if (success) {
          console.log(`Successfully attached QR key to business ${createdBusinessId}`);
          Alert.alert('Success', `Business "${createdBusinessName}" created with QR code.`);
          onBusinessCreated(createdBusinessId, createdBusinessName); // Notify parent
          resetForm(); // Reset everything
        } else {
          Alert.alert('Error', 'Business created, but failed to attach QR code. You may need to do this manually.');
          // Still notify parent, business exists
          onBusinessCreated(createdBusinessId, createdBusinessName);
          resetForm();
        }
      } else if (createdBusinessId) {
        // Case: User skipped (qrCodeKey is null)
        Alert.alert('Skipped', `Business "${createdBusinessName}" created without a QR code.`);
        onBusinessCreated(createdBusinessId, createdBusinessName); // Notify parent
        resetForm(); // Reset everything
      } else {
        // Case: Should not happen if logic is correct
        console.error("handleQrComplete called unexpectedly without a business ID.");
        Alert.alert('Error', 'An unexpected error occurred during QR processing.');
        resetForm();
        onCancel(); // Close modal as state is likely inconsistent
      }
    } catch (qrError: any) {
      console.error("Error during QR attachment/handling:", qrError);
      Alert.alert('Error', `Failed during QR step: ${qrError.message || 'Unknown error'}`);
      // Decide if you still call onBusinessCreated or just reset/cancel
      resetForm();
      // Maybe call onCancel() if the state is inconsistent?
    } finally {
      setIsLoading(false); // ALWAYS stop loading indicator after QR step completes or fails
    }
  };

  return (
    <Modal
      animationType="fade" // Or "slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={() => {
        if (!isLoading) { // Prevent closing while loading
          resetForm();
          onCancel();
        }
      }}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>

          {/* Conditional Rendering for Form vs QR Scanner */}
          {qrCaptureVisible ? (
            // --- QR Scanner View ---
            <View style={{ flex: 1 }}>
              <Text style={styles.modalTitle}>Generating Business QR Code</Text>
              {newBusinessId ? (
                <QRCodeCapture
                  value={newBusinessId}
                  entityType="Business"
                  entityId={newBusinessId}
                  onCapture={handleQrComplete}
                  size={250}
                />
              ) : (
                <ActivityIndicator size="large" color="#007bff" />
              )}
              <Text style={{ textAlign: 'center', marginTop: 10, color: '#555' }}>Generating and saving QR code...</Text>
              <View style={{ marginTop: 15, alignItems: 'center' }}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton, { alignSelf: 'center' }, isLoading ? styles.disabledButton : null]}
                  onPress={() => handleQrComplete(null)}
                  disabled={isLoading}
                >
                  <Text style={styles.buttonText}>Skip / Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
          // --- Form View ---
          <>
            <Text style={styles.modalTitle}>Create New Business</Text>
            {/* ScrollView should contain all inputs */}
            <ScrollView style={styles.scrollView}>
              {/* Business Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Business Name *</Text>
                <TextInput
                  style={[styles.input, !businessName && isFormValid === false ? styles.inputError : null]} // Example validation style
                  placeholder="Enter business name"
                  value={businessName}
                  onChangeText={setBusinessName}
                  editable={!isLoading}
                />
                {/* Simple error message example */}
                {/* {!businessName && isFormValid === false && <Text style={styles.errorMessage}>Business name is required.</Text>} */}
              </View>

              {/* First Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Owner First Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter owner's first name"
                  value={firstName}
                  onChangeText={setFirstName}
                  editable={!isLoading}
                />
              </View>

              {/* Last Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Owner Last Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter owner's last name"
                  value={lastName}
                  onChangeText={setLastName}
                  editable={!isLoading}
                />
              </View>

              {/* Phone Number */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Phone Number *</Text>
                <View> {/* Wrap input and indicator */}
                  <TextInput
                    style={[styles.input, phoneExists ? styles.inputError : null]}
                    placeholder="Enter phone number (e.g., 5551234567)"
                    value={phoneNumber} // Display cleaned number
                    onChangeText={handlePhoneChange}
                    keyboardType="phone-pad"
                    autoComplete={Platform.OS === 'ios' ? 'tel' : 'tel-national'} // Platform specific autocomplete
                    maxLength={15} // Set reasonable max length
                    editable={!isLoading && !isCheckingPhone}
                  />
                  {/* Indicators */}
                  <View style={styles.phoneCheckIndicator}>
                    {isCheckingPhone ? <ActivityIndicator size="small" color="#007bff" /> : null}
                    {phoneCheckComplete && !isCheckingPhone && !phoneExists ? (
                      <Text>
                        <Icon name="check-circle" size={20} color="green" />
                      </Text>
                    ) : null}
                    {phoneCheckComplete && !isCheckingPhone && phoneExists ? (
                      <Text>
                        <Icon name="alert-circle" size={20} color="red" />
                      </Text>
                    ) : null}
                  </View>
                </View>
                {phoneCheckComplete && phoneExists && <Text style={styles.errorMessage}>This phone number is already registered.</Text>}
              </View>

              {/* Address */}
              {/* <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Address</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter street address"
                    value={address}
                    onChangeText={setAddress}
                    editable={!isLoading}
                  />
                </View> */}

              {/* City */}
              {/* <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>City</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter city"
                    value={city}
                    onChangeText={setCity}
                    editable={!isLoading}
                  />
                </View> */}

              {/* State */}
              {/* <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>State</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter state/province"
                    value={state}
                    onChangeText={setState}
                    editable={!isLoading}
                  />
                </View> */}

              {/* Zip Code */}
              {/* <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Zip/Postal Code</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter zip code"
                    value={zipCode}
                    onChangeText={setZipCode}
                    keyboardType="numeric"
                    editable={!isLoading}
                  />
                </View> */}
            </ScrollView>

            {/* Button Container */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton, isLoading ? styles.disabledButton : null]}
                onPress={() => { if (!isLoading) { resetForm(); onCancel(); } }}
                disabled={isLoading}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.clearButton, isLoading ? styles.disabledButton : null]}
                onPress={() => { if (!isLoading) { resetForm(); } }} // Only reset fields, don't close
                disabled={isLoading}
              >
                <Text style={styles.buttonText}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.createButton,
                  (!isFormValid || isLoading || isCheckingPhone || phoneExists) ? styles.disabledButton : null // More comprehensive disabled check
                ]}
                onPress={handleCreateBusiness}
                disabled={!isFormValid || isLoading || isCheckingPhone || phoneExists}
              >
                <Text style={styles.buttonText}>Create</Text>
              </TouchableOpacity>
            </View>
          </>
          )}

          {/* Loading Indicator - Rendered *outside* the conditional, covers modalContent */}
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007bff" />
              <Text style={{ marginTop: 10, color: '#555' }}>Processing...</Text>
            </View>
          )}

        </View>
      </View>
    </Modal>
  );
};

export default CreateBusinessModal; 