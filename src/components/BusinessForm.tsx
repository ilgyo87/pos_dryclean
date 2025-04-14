import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { View, Text, TextInput, StyleSheet, ActivityIndicator } from 'react-native';

// Create component with forwardRef to access from parent
const BusinessForm = forwardRef(({ 
  onCloseModal, 
  createOrEdit, 
  params, 
  onFormChange 
}: { 
  onCloseModal: () => void, 
  createOrEdit: 'create' | 'edit', 
  params: Record<string, any>,
  onFormChange?: () => void 
}, ref) => {
    const [businessName, setBusinessName] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [isFormValid, setIsFormValid] = useState(false);
    const [phoneNumberAvailable, setPhoneNumberAvailable] = useState<boolean | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Expose methods to parent via ref
    useImperativeHandle(ref, () => ({
        resetForm: () => {
            setBusinessName('');
            setFirstName('');
            setLastName('');
            setPhoneNumber('');
            setIsFormValid(false);
            setPhoneNumberAvailable(null);
        }
    }));

    useEffect(() => {
        // Initialize form with params data if editing
        if (createOrEdit === 'edit' && params) {
            setBusinessName(params.businessName || '');
            setFirstName(params.firstName || '');
            setLastName(params.lastName || '');
            setPhoneNumber(params.phoneNumber || '');
        }
    }, [createOrEdit, params]);

    // Call onFormChange whenever any field changes
    useEffect(() => {
        if (onFormChange) {
            onFormChange();
        }
    }, [businessName, firstName, lastName, phoneNumber]);

    // Your existing render code here
    return (
        <View style={styles.container}>
            <Text style={styles.label}>Business Name</Text>
            <TextInput
                placeholder="Enter business name"
                value={businessName}
                onChangeText={setBusinessName}
                style={styles.input}
                placeholderTextColor="#A0A0A0"
            />

            <Text style={styles.label}>First Name*</Text>
            <TextInput
                placeholder="Enter first name"
                value={firstName}
                onChangeText={setFirstName}
                style={styles.input}
                placeholderTextColor="#A0A0A0"
            />

            <Text style={styles.label}>Last Name*</Text>
            <TextInput
                placeholder="Enter last name"
                value={lastName}
                onChangeText={setLastName}
                style={styles.input}
                placeholderTextColor="#A0A0A0"
            />

            <Text style={styles.label}>Phone Number*</Text>
            <TextInput
                placeholder="Enter phone number"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                style={styles.input}
                placeholderTextColor="#A0A0A0"
                keyboardType="phone-pad"
            />
            
            {isLoading && <ActivityIndicator size="small" color="#0000ff" />}
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 10,
    },
    label: {
        marginBottom: 5,
        fontWeight: '500',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        padding: 10,
        marginBottom: 15,
    }
});

export default BusinessForm;