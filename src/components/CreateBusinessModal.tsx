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
import { styles } from './../styles/components/createBusinessStyles';
import { useAuthenticator } from "@aws-amplify/ui-react-native";
// Import QR code utilities
import { generateQRCodeData, saveQRCodeToS3 } from '../utils/qrCodeGenerator';
// For QR code generation
import QRCode from 'qrcode';

// Initialize Amplify client
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
  
  // New states for phone number validation
  const [isCheckingPhone, setIsCheckingPhone] = useState(false);
  const [phoneExists, setPhoneExists] = useState(false);
  const [phoneCheckComplete, setPhoneCheckComplete] = useState(false);
  
  // New state for QR code generation
  const [generatingQRCode, setGeneratingQRCode] = useState(false);

  const { user } = useAuthenticator();

  // Check phone number exists when it changes
  const checkPhoneExists = async (phone: string) => {
    if (!phone || phone.trim().length < 10) return; // Don't check until we have a valid phone
    
    try {
      setIsCheckingPhone(true);
      
      // Query for businesses with this phone number
      const result = await client.models.Business.list({
        filter: { phoneNumber: { eq: phone.trim() } }
      });
      
      // Update state based on results
      const exists = result.data && result.data.length > 0;
      setPhoneExists(exists);
      setPhoneCheckComplete(true);
      
      // Optionally show alert
      if (exists) {
        Alert.alert('Business Exists', 'A business with this phone number already exists.');
      }
    } catch (error) {
      console.error('Error checking phone number:', error);
    } finally {
      setIsCheckingPhone(false);
    }
  };

  // Check if all required fields are filled and phone number is valid
  useEffect(() => {
    const allFieldsFilled = 
      businessName.trim() !== '' && 
      firstName.trim() !== '' && 
      lastName.trim() !== '' && 
      phoneNumber.trim() !== '' && 
      address.trim() !== '' && 
      city.trim() !== '' && 
      state.trim() !== '' && 
      zipCode.trim() !== '';
    
    // Only valid if all fields are filled AND either phone check isn't complete yet OR phone doesn't exist
    setIsFormValid(allFieldsFilled && (!phoneCheckComplete || !phoneExists));
  }, [businessName, firstName, lastName, phoneNumber, address, city, state, zipCode, phoneCheckComplete, phoneExists]);

  // Generate QR code for the business
  const generateBusinessQRCode = async (businessId: string, businessData: any): Promise<string | null> => {
    try {
      setGeneratingQRCode(true);
      
      // Generate QR code data
      const qrData = generateQRCodeData('Business', businessData);
      
      // Convert QR data to image
      const qrCodeUrl = await QRCode.toDataURL(qrData);
      
      // Convert the data URL to a Blob
      const response = await fetch(qrCodeUrl);
      const blob = await response.blob();
      
      // Save QR code image to S3
      return await saveQRCodeToS3(
        'Business', 
        businessId, 
        businessId, // Business ID is used for both entity ID and business ID
        blob
      );
    } catch (error) {
      console.error('Error generating QR code:', error);
      return null;
    } finally {
      setGeneratingQRCode(false);
    }
  };

  const handleCreateBusiness = async () => {
    // No need for field validation here since the button is disabled when isFormValid is false
    setIsLoading(true);
    
    try {
      // Do one final check for existing phone number
      const checkResult = await client.models.Business.list({
        filter: { phoneNumber: { eq: phoneNumber.trim() } }
      });
      
      if (checkResult.data && checkResult.data.length > 0) {
        Alert.alert('Error', 'A business with this phone number already exists.');
        setIsLoading(false);
        return;
      }
      
      // Create business in Amplify
      const result = await client.models.Business.create({
        name: businessName.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phoneNumber: phoneNumber.trim(),
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        zipCode: zipCode.trim(),
        owner: user?.username
      });
      
      if (result.errors) {
        throw new Error(result.errors.map(e => e.message).join(', '));
      }
      
      // Generate QR code for the new business
      const businessData = {
        id: result.data?.id ?? '',
        name: result.data?.name ?? '',
        phoneNumber: result.data?.phoneNumber ?? '',
        address: result.data?.address ?? '',
        city: result.data?.city ?? '',
        state: result.data?.state ?? '',
        zipCode: result.data?.zipCode ?? ''
      };
      
      // Generate and save the QR code
      const qrCodeUrl = await generateBusinessQRCode(result.data?.id ?? '', businessData);
      
      if (!qrCodeUrl) {
        console.warn('QR code generation failed, but business was created');
      }
      
      // Call the callback with the new business info
      onBusinessCreated(result.data?.id ?? '', result.data?.name ?? '');
      
      // Reset form
      setBusinessName('');
      setFirstName('');
      setLastName('');
      setPhoneNumber('');
      setAddress('');
      setCity('');
      setState('');
      setZipCode('');
      
    } catch (error) {
      console.error('Error creating business:', error);
      Alert.alert('Error', 'Failed to create business. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={() => {
        // Handle back button press on Android
      }}
    >
      <View style={styles.centeredView}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Create Your Business</Text>
            <Text style={styles.modalSubtitle}>Let's get started with your dry cleaning business</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Business Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your business name"
                value={businessName}
                onChangeText={setBusinessName}
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>First Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your first name"
                value={firstName}
                onChangeText={setFirstName}
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Last Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your last name"
                value={lastName}
                onChangeText={setLastName}
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Phone Number *</Text>
              <TextInput
                style={[
                  styles.input,
                  phoneCheckComplete && (phoneExists ? { borderColor: 'red', borderWidth: 1 } : { borderColor: 'green', borderWidth: 1 })
                ]}
                placeholder="Enter business phone number"
                value={phoneNumber}
                onChangeText={(text) => {
                  setPhoneNumber(text);
                  // Reset the check states when user types
                  setPhoneCheckComplete(false);
                  setPhoneExists(false);
                }}
                onBlur={() => checkPhoneExists(phoneNumber)}
                keyboardType="phone-pad"
              />
              {isCheckingPhone && <Text>Checking phone number...</Text>}
              {phoneCheckComplete && phoneExists && (
                <Text style={{ color: 'red' }}>Business with this phone already exists</Text>
              )}
              {phoneCheckComplete && !phoneExists && phoneNumber.trim().length >= 10 && (
                <Text style={{ color: 'green' }}>Business phone number available</Text>
              )}
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Address *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter street address"
                value={address}
                onChangeText={setAddress}
              />
            </View>
            
            <View style={styles.rowContainer}>
              <View style={styles.cityInput}>
                <Text style={styles.inputLabel}>City *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="City"
                  value={city}
                  onChangeText={setCity}
                />
              </View>
              
              <View style={styles.stateInput}>
                <Text style={styles.inputLabel}>State *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="State"
                  value={state}
                  onChangeText={setState}
                />
              </View>
              
              <View style={styles.zipInput}>
                <Text style={styles.inputLabel}>ZIP *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="ZIP"
                  value={zipCode}
                  onChangeText={setZipCode}
                  keyboardType="numeric"
                />
              </View>
            </View>
            
            <TouchableOpacity 
              style={[styles.button, (!isFormValid || isLoading || generatingQRCode) && styles.buttonDisabled]} 
              onPress={handleCreateBusiness}
              disabled={!isFormValid || isLoading || generatingQRCode}
            >
              {isLoading || generatingQRCode ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color="#ffffff" />
                  <Text style={styles.loadingText}>
                    {generatingQRCode ? 'Generating QR Code...' : 'Creating Business...'}
                  </Text>
                </View>
              ) : (
                <Text style={styles.buttonText}>Create Business</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

export default CreateBusinessModal;