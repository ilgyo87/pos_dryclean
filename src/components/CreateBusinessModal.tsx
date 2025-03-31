// src/components/CreateBusinessModal.tsx
import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView
} from 'react-native';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { useAuthenticator } from '@aws-amplify/ui-react-native';
import { seedBusinessData } from '../utils/seedData'; // Import seeding function
import QRCodeCapture from './QRCodeCapture'; // Import the QR code capture component
import { attachQRCodeKeyToEntity } from '../utils/qrCodeGenerator'; // Import the new function
import { styles } from '../styles/components/createBusinessStyles'; // Import styles

const client = generateClient<Schema>();

interface CreateBusinessModalProps {
  visible: boolean;
  onBusinessCreated: (businessId: string, businessName: string) => void;
}

const CreateBusinessModal: React.FC<CreateBusinessModalProps> = ({
  visible,
  onBusinessCreated
}) => {
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

  // States for phone number validation
  const [isCheckingPhone, setIsCheckingPhone] = useState(false);
  const [phoneExists, setPhoneExists] = useState(false);
  const [phoneCheckComplete, setPhoneCheckComplete] = useState(false);

  // States for QR code process
  const [qrCaptureVisible, setQrCaptureVisible] = useState(false);
  const [newBusinessId, setNewBusinessId] = useState('');

  const { user } = useAuthenticator();

  // Validate all form fields on change
  useEffect(() => {
    const isValid =
      businessName.trim() !== '' &&
      firstName.trim() !== '' &&
      lastName.trim() !== '' &&
      phoneNumber.trim() !== '' &&
      phoneNumber.trim().length >= 10 &&
      address.trim() !== '' &&
      city.trim() !== '' &&
      state.trim() !== '' &&
      zipCode.trim() !== '' &&
      !phoneExists &&
      phoneCheckComplete; // Ensure phone check is done

    setIsFormValid(isValid);
  }, [businessName, firstName, lastName, phoneNumber, address, city, state, zipCode, phoneExists, phoneCheckComplete]);

  // Check phone number exists when it changes
  const checkPhoneExists = async (phone: string) => {
    if (phone.trim().length < 10) {
      setPhoneExists(false); // Reset if phone number is too short
      setPhoneCheckComplete(false);
      return;
    };

    setIsCheckingPhone(true);
    setPhoneCheckComplete(false); // Reset completion status

    try {
      const result = await client.models.Business.list({
        filter: { phoneNumber: { eq: phone.trim() } }
      });

      setPhoneExists(result.data && result.data.length > 0);
    } catch (error) {
      console.error('Error checking phone:', error);
      setPhoneExists(false); // Assume not exists on error? Or handle differently?
    } finally {
      setIsCheckingPhone(false);
      setPhoneCheckComplete(true); // Mark check as complete
    }
  };

  // Debounce phone checking
  useEffect(() => {
    const timer = setTimeout(() => {
      if (phoneNumber.trim().length >= 10) {
        checkPhoneExists(phoneNumber);
      } else {
        // If phone number becomes invalid, reset phone check state
        setPhoneExists(false);
        setPhoneCheckComplete(false);
        setIsCheckingPhone(false);
      }
    }, 500); // Debounce time

    return () => clearTimeout(timer);
  }, [phoneNumber]);


  // Function to reset all form fields and states
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
    setNewBusinessId('');
  };


  const handleCreateBusiness = async () => {
    if (!user?.userId) {
      Alert.alert('Error', 'User not authenticated.');
      return;
    }
    setIsLoading(true);

    try {
      // Final phone check just in case
      const checkResult = await client.models.Business.list({
        filter: { phoneNumber: { eq: phoneNumber.trim() } }
      });
      if (checkResult.data && checkResult.data.length > 0) {
        Alert.alert('Error', 'A business with this phone number already exists.');
        setIsLoading(false);
        setPhoneExists(true); // Update state based on final check
        setPhoneCheckComplete(true);
        return;
      }

      // Create business in Amplify
      const result = await client.models.Business.create({
        name: businessName.trim(),
        owner: `${firstName.trim()} ${lastName.trim()}`,
        phoneNumber: phoneNumber.trim(),
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        zipCode: zipCode.trim(),
        id: user.userId,
      });

      if (result.data && result.data.id) {
        console.log("Business created, starting seeding:", result.data.id);
        await seedBusinessData(result.data.id);
        console.log("Data seeding complete for:", result.data.id);

        // Set the new business ID and trigger QR capture UI
        setNewBusinessId(result.data.id);
        setQrCaptureVisible(true);
        // Don't close the main modal yet, wait for QR capture

      } else {
        console.error('Failed to create business or result missing ID:', result.errors);
        throw new Error('Failed to create business');
      }
    } catch (error) {
      console.error('Error creating business:', error);
      Alert.alert('Error', 'Failed to create business. Please try again.');
      setIsLoading(false);
    }
    // setIsLoading(false) is handled after QR code process or on error/cancellation
  };


  // Handle QR code capture completion (upload done, key received)
  const handleQRCodeCaptured = async (qrCodeKey: string | null) => {
    setQrCaptureVisible(false); // Hide the QR capture UI
    setIsLoading(false); // Business creation process is now fully complete or failed

    const createdBusinessId = newBusinessId; // Capture the ID before reset
    const createdBusinessName = businessName.trim(); // Capture the name

    if (qrCodeKey && createdBusinessId) {
      console.log(`QR Code captured/uploaded for business ${createdBusinessId}. Attaching key: ${qrCodeKey}`);
      // Attach the generated S3 key to the business record
      const success = await attachQRCodeKeyToEntity('Business', createdBusinessId, qrCodeKey);

      if (success) {
        console.log(`Successfully attached QR key to business ${createdBusinessId}`);
        resetForm(); // Reset form fields
        onBusinessCreated(createdBusinessId, createdBusinessName); // Notify parent component
      } else {
        Alert.alert('Error', 'Failed to attach QR code to the business record. Please check logs.');
        // Consider cleanup or retry logic here
      }
    } else {
      Alert.alert('Error', `QR code generation/upload failed for business ${createdBusinessId}. Key: ${qrCodeKey}`);
      // Handle the case where QR code capture/upload failed
      // Maybe delete the business record if QR is essential?
       console.warn(`Attempting to delete business ${createdBusinessId} due to QR failure.`);
       try {
           await client.models.Business.delete({ id: createdBusinessId });
           console.log(`Successfully deleted business ${createdBusinessId}`);
       } catch (deleteError) {
           console.error(`Failed to delete business ${createdBusinessId} after QR failure:`, deleteError);
           Alert.alert('Cleanup Error', 'Failed to automatically clean up the partially created business. Please check your records.');
       }
       resetForm(); // Reset form even on failure
    }
  };

  const handleCancel = () => {
    resetForm();
  };


  return (
    <Modal
      visible={visible}
      onRequestClose={handleCancel} // Handle back button press on Android
      animationType="slide"
      transparent={true}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Create New Business</Text>

          <ScrollView style={styles.scrollView}>
            {/* Business Name */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Business Name *</Text>
              <TextInput
                style={styles.input}
                value={businessName}
                onChangeText={setBusinessName}
                placeholder="Enter business name"
              />
            </View>

            {/* Owner Info */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Owner First Name *</Text>
              <TextInput
                style={styles.input}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Enter owner's first name"
              />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Owner Last Name *</Text>
              <TextInput
                style={styles.input}
                value={lastName}
                onChangeText={setLastName}
                placeholder="Enter owner's last name"
              />
            </View>

            {/* Phone Number */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Phone Number *</Text>
              <TextInput
                style={[styles.input, phoneExists ? styles.inputError : null]}
                value={phoneNumber}
                onChangeText={setPhoneNumber} // Will trigger debounced check
                placeholder="Enter business phone number"
                keyboardType="phone-pad"
                maxLength={14} // Adjust as needed for formatting +1 (XXX) XXX-XXXX
              />
              {isCheckingPhone && <ActivityIndicator size="small" color="#0000ff" />}
              {phoneCheckComplete && phoneExists && (
                <Text style={styles.errorText}>This phone number is already registered.</Text>
              )}
              {phoneCheckComplete && !phoneExists && phoneNumber.length >= 10 && (
                <Text style={styles.successText}>Phone number available.</Text>
              )}
            </View>

            {/* Address Info */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Address *</Text>
              <TextInput
                style={styles.input}
                value={address}
                onChangeText={setAddress}
                placeholder="Enter street address"
              />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>City *</Text>
              <TextInput
                style={styles.input}
                value={city}
                onChangeText={setCity}
                placeholder="Enter city"
              />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>State *</Text>
              <TextInput
                style={styles.input}
                value={state}
                onChangeText={setState}
                placeholder="Enter state (e.g., CA)"
                maxLength={2} // Common for US states
                autoCapitalize="characters"
              />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Zip Code *</Text>
              <TextInput
                style={styles.input}
                value={zipCode}
                onChangeText={setZipCode}
                placeholder="Enter zip code"
                keyboardType="number-pad"
                maxLength={5}
              />
            </View>

          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleCancel}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                styles.createButton,
                (!isFormValid || isLoading) ? styles.disabledButton : null
              ]}
              disabled={!isFormValid || isLoading}
              onPress={handleCreateBusiness}
            >
              {isLoading && !qrCaptureVisible ? ( // Show spinner only during initial creation
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Create Business</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* QR Code Capture Modal/Overlay */}
      {qrCaptureVisible && newBusinessId && (
        <Modal
          visible={qrCaptureVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => {
            // Handle cancellation during QR generation
            console.warn("QR Code generation cancelled by user (onRequestClose).");
            Alert.alert(
              "Cancel QR Step?",
              "If you cancel now, the business might be created without a QR code. Do you want to proceed with cancellation? This might require manual cleanup.",
              [
                { text: "No", style: "cancel" },
                {
                  text: "Yes, Cancel",
                  style: "destructive",
                  onPress: async () => {
                    setIsLoading(false); // Re-enable form buttons potentially
                    setQrCaptureVisible(false);
                    // Attempt to delete the partially created business
                    console.warn(`Attempting to delete business ${newBusinessId} due to cancellation.`);
                    try {
                        await client.models.Business.delete({ id: newBusinessId });
                        console.log(`Successfully deleted business ${newBusinessId}`);
                        Alert.alert("Cancelled", "Business creation cancelled and record deleted.");
                    } catch (deleteError) {
                        console.error(`Failed to delete business ${newBusinessId}:`, deleteError);
                        Alert.alert("Cleanup Error", "Failed to automatically delete the business record. Please check manually.");
                    }
                    resetForm(); // Reset form state
                  },
                },
              ]
            );
          }}
        >
          <View style={styles.qrCaptureOverlay}>
            <View style={styles.qrCaptureBox}>
              <Text style={styles.modalTitle}>Generating QR Code</Text>
              <ActivityIndicator size="large" color="#0000ff" style={{ marginVertical: 20 }} />
              <Text style={{ marginBottom: 20 }}>Please wait, uploading QR code...</Text>
              {/* Render QRCodeCapture off-screen to trigger its logic */}
              <View style={{ opacity: 0, position: 'absolute', top: -1000, left: -1000 }}>
                <QRCodeCapture
                  entityType="Business"
                  entityId={newBusinessId}
                  onCapture={handleQRCodeCaptured} // Callback receives the s3Key
                  value={`business:${newBusinessId}`} // Value needed for QR code content itself
                  size={200} // Size needed for captureRef
                />
              </View>
              {/* Optional: Add a manual cancel button here too? */}
               <TouchableOpacity
                style={[styles.button, styles.cancelButton, { marginTop: 10 }]}
                onPress={() => { // Same logic as onRequestClose
                    console.warn("QR Code generation cancelled by user button.");
                    Alert.alert(
                      "Cancel QR Step?",
                      "If you cancel now, the business might be created without a QR code. Do you want to proceed with cancellation? This might require manual cleanup.",
                      [
                        { text: "No", style: "cancel" },
                        {
                          text: "Yes, Cancel",
                          style: "destructive",
                          onPress: async () => {
                            setIsLoading(false);
                            setQrCaptureVisible(false);
                             console.warn(`Attempting to delete business ${newBusinessId} due to cancellation.`);
                             try {
                                 await client.models.Business.delete({ id: newBusinessId });
                                 console.log(`Successfully deleted business ${newBusinessId}`);
                                 Alert.alert("Cancelled", "Business creation cancelled and record deleted.");
                             } catch (deleteError) {
                                 console.error(`Failed to delete business ${newBusinessId}:`, deleteError);
                                 Alert.alert("Cleanup Error", "Failed to automatically delete the business record. Please check manually.");
                             }
                             resetForm();
                          },
                        },
                      ]
                    );
                }}
              >
                <Text style={styles.buttonText}>Cancel QR Step</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </Modal>
  );
};

export default CreateBusinessModal;