// src/components/CreateBusinessModal.tsx
import React, { useState } from 'react';
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
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateBusiness = async () => {
    // Validate inputs
    if (!businessName.trim()) {
      Alert.alert('Error', 'Business name is required');
      return;
    }
    
    if (!phoneNumber.trim()) {
      Alert.alert('Error', 'Phone number is required');
      return;
    }

    setIsLoading(true);
    
    try {
      // Create business in Amplify
      const result = await client.models.Business.create({
        name: businessName.trim(),
        phoneNumber: phoneNumber.trim(),
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        zipCode: zipCode.trim(),
        owner: 'current-user' // You'll need to replace this with the actual user ID
      });
      
      if (result.errors) {
        throw new Error(result.errors.map(e => e.message).join(', '));
      }
      
      // Call the callback with the new business info
      onBusinessCreated(result.data?.id ?? '', result.data?.name ?? '');
      
      // Reset form
      setBusinessName('');
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
      onRequestClose={() => {}}
    >
      <View style={styles.centeredView}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Create Your Business</Text>
            <Text style={styles.modalSubtitle}>
              You don't have a business yet. Let's create one to get started.
            </Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Business Name *</Text>
              <TextInput
                style={styles.input}
                value={businessName}
                onChangeText={setBusinessName}
                placeholder="Enter business name"
                autoCapitalize="words"
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Phone Number *</Text>
              <TextInput
                style={styles.input}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                placeholder="Enter phone number"
                keyboardType="phone-pad"
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Street Address</Text>
              <TextInput
                style={styles.input}
                value={address}
                onChangeText={setAddress}
                placeholder="Enter street address"
              />
            </View>
            
            <View style={styles.rowContainer}>
              <View style={[styles.inputContainer, styles.cityInput]}>
                <Text style={styles.inputLabel}>City</Text>
                <TextInput
                  style={styles.input}
                  value={city}
                  onChangeText={setCity}
                  placeholder="City"
                />
              </View>
              
              <View style={[styles.inputContainer, styles.stateInput]}>
                <Text style={styles.inputLabel}>State</Text>
                <TextInput
                  style={styles.input}
                  value={state}
                  onChangeText={setState}
                  placeholder="State"
                  maxLength={2}
                  autoCapitalize="characters"
                />
              </View>
              
              <View style={[styles.inputContainer, styles.zipInput]}>
                <Text style={styles.inputLabel}>ZIP Code</Text>
                <TextInput
                  style={styles.input}
                  value={zipCode}
                  onChangeText={setZipCode}
                  placeholder="ZIP"
                  keyboardType="numeric"
                  maxLength={5}
                />
              </View>
            </View>
            
            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleCreateBusiness}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
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