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
import { 
  generateQRCodeData, 
  generateAndUploadQRCode, 
  attachQRCodeToEntity 
} from '../utils/qrCodeGenerator';
// For QR code generation
import QRCode from 'qrcode';
import { seedBusinessData } from '../utils/seedDatabase';

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
      !phoneExists;
    
    setIsFormValid(isValid);
  }, [businessName, firstName, lastName, phoneNumber, address, city, state, zipCode, phoneExists]);

  // Check phone number exists when it changes
  const checkPhoneExists = async (phone: string) => {
    if (phone.trim().length < 10) return;
    
    setIsCheckingPhone(true);
    setPhoneCheckComplete(false);
    
    try {
      const result = await client.models.Business.list({
        filter: { phoneNumber: { eq: phone.trim() } }
      });
      
      setPhoneExists(result.data && result.data.length > 0);
    } catch (error) {
      console.error('Error checking phone:', error);
    } finally {
      setIsCheckingPhone(false);
      setPhoneCheckComplete(true);
    }
  };

  // Debounce phone checking
  useEffect(() => {
    const timer = setTimeout(() => {
      if (phoneNumber.trim().length >= 10) {
        checkPhoneExists(phoneNumber);
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [phoneNumber]);

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
      
      if (result.data) {
        const business = result.data;
        
        // Generate and upload QR code
        setGeneratingQRCode(true);
        
        // Use the generateAndUploadQRCode function to create and store QR code
        const qrCodeUrl = await generateAndUploadQRCode('Business', {
          id: business.id,
          name: business.name,
          firstName: business.firstName,
          lastName: business.lastName,
          phoneNumber: business.phoneNumber,
          address: business.address,
          city: business.city,
          state: business.state,
          zipCode: business.zipCode
        });
        
        if (qrCodeUrl) {
          // Update the business record with the QR code URL
          await client.models.Business.update({
            id: business.id,
            qrCode: qrCodeUrl
          });
        }
        
        // Create initial demo/seed data for the business
        await seedBusinessData(business.id);
        
        // Notify parent component
        onBusinessCreated(business.id, business.name);
        
        // Reset form
        setBusinessName('');
        setFirstName('');
        setLastName('');
        setPhoneNumber('');
        setAddress('');
        setCity('');
        setState('');
        setZipCode('');
      }
    } catch (error) {
      console.error('Error creating business:', error);
      Alert.alert('Error', 'Failed to create business. Please try again.');
    } finally {
      setIsLoading(false);
      setGeneratingQRCode(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Create New Business</Text>
          
          <ScrollView style={styles.scrollView}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Business Name *</Text>
              <TextInput
                style={styles.input}
                value={businessName}
                onChangeText={setBusinessName}
                placeholder="Enter business name"
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Owner First Name *</Text>
              <TextInput
                style={styles.input}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Enter first name"
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Owner Last Name *</Text>
              <TextInput
                style={styles.input}
                value={lastName}
                onChangeText={setLastName}
                placeholder="Enter last name"
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Phone Number *</Text>
              <TextInput
                style={[
                  styles.input,
                  phoneExists ? styles.inputError : null
                ]}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                placeholder="Enter phone number"
                keyboardType="phone-pad"
              />
              {isCheckingPhone && (
                <Text style={styles.validatingText}>Checking...</Text>
              )}
              {phoneCheckComplete && phoneExists && (
                <Text style={styles.errorText}>
                  This phone number is already registered
                </Text>
              )}
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Address *</Text>
              <TextInput
                style={styles.input}
                value={address}
                onChangeText={setAddress}
                placeholder="Enter address"
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
                placeholder="Enter state"
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Zip Code *</Text>
              <TextInput
                style={styles.input}
                value={zipCode}
                onChangeText={setZipCode}
                placeholder="Enter zip code"
                keyboardType="numeric"
              />
            </View>
          </ScrollView>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={() => {
                // Reset form and close modal
                setBusinessName('');
                setFirstName('');
                setLastName('');
                setPhoneNumber('');
                setAddress('');
                setCity('');
                setState('');
                setZipCode('');
                onBusinessCreated('', ''); // Cancel
              }}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.button, 
                styles.createButton,
                (!isFormValid || isLoading || generatingQRCode) ? styles.disabledButton : null
              ]}
              disabled={!isFormValid || isLoading || generatingQRCode}
              onPress={handleCreateBusiness}
            >
              {isLoading || generatingQRCode ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Create Business</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default CreateBusinessModal;