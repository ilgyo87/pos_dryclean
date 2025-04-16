// src/components/BusinessForm.tsx
import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { View, Text, TextInput, StyleSheet, ActivityIndicator } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { usePhoneNumberAvailability } from './usePhoneNumberAvailability';

// Create component with forwardRef to access from parent
const BusinessForm = forwardRef(({ 
  onCloseModal, 
  createOrEdit, 
  params, 
  onFormChange,
  onBusinessCreated
}: { 
  onCloseModal: () => void, 
  createOrEdit: 'create' | 'edit', 
  params: Record<string, any>,
  onFormChange?: () => void,
  onBusinessCreated?: () => void
}, ref) => {
    // Get existing business if in edit mode
    const existingBusiness = createOrEdit === 'edit' ? params?.business : null;

    // Form state
    const [businessName, setBusinessName] = useState(existingBusiness?.name || '');
    const [firstName, setFirstName] = useState(existingBusiness?.firstName || '');
    const [lastName, setLastName] = useState(existingBusiness?.lastName || '');
    const [address, setAddress] = useState(existingBusiness?.address || '');
    const [city, setCity] = useState(existingBusiness?.city || '');
    const [state, setState] = useState(existingBusiness?.state || '');
    const [zipCode, setZipCode] = useState(existingBusiness?.zipCode || '');
    const [email, setEmail] = useState(existingBusiness?.email || '');

    // Phone number with availability check
    const {
        phoneNumber,
        setPhoneNumber,
        isAvailable: phoneNumberAvailable,
        isChecking: isCheckingPhone,
        getPhoneInputStyle,
        getPhoneStatusText
    } = usePhoneNumberAvailability({
        initialPhoneNumber: existingBusiness?.phoneNumber || '',
        currentEntityId: existingBusiness?.id,
        entityType: 'Business'
    });

    // Get loading state from Redux store
    const isReduxLoading = useSelector((state: RootState) => state.business?.isLoading || false);
    const [isLoading, setIsLoading] = useState(false);

    // Update loading state from Redux
    useEffect(() => {
        setIsLoading(isReduxLoading);
    }, [isReduxLoading]);

    // Expose methods to parent via ref
    useImperativeHandle(ref, () => ({
        resetForm: () => {
            if (createOrEdit === 'edit' && existingBusiness) {
                // Reset to original values
                setBusinessName(existingBusiness.name || '');
                setFirstName(existingBusiness.firstName || '');
                setLastName(existingBusiness.lastName || '');
                setPhoneNumber(existingBusiness.phoneNumber || '');
            } else {
                // Clear form
                setBusinessName('');
                setFirstName('');
                setLastName('');
                setPhoneNumber('');
            }
        },
        validateAndGetFormData: () => {
            console.log('BusinessForm.validateAndGetFormData called');
            
            // Basic validation
            if (!businessName.trim()) {
                console.log('Business name is required');
                return { valid: false, message: "Business name is required" };
            }
            if (!phoneNumber.trim()) {
                console.log('Phone number is required');
                return { valid: false, message: "Phone number is required" };
            }
            // Check if phone number is available
            if (phoneNumberAvailable === false) {
                console.log('Phone number is not available');
                return { valid: false, message: "This phone number is already in use" };
            }

            // Return the form data
            const businessData = {
                // This is the critical field - must be called 'name'
                name: businessName.trim(),
                firstName: firstName.trim() || undefined,
                lastName: lastName.trim() || undefined,
                phoneNumber: phoneNumber.trim(),
            };
            
            console.log('Business data being returned:', businessData);

            // Add ID if editing
            if (createOrEdit === 'edit' && existingBusiness?.id) {
                return {
                    ...businessData,
                    id: existingBusiness.id,
                    valid: true
                };
            }

            return { ...businessData, valid: true };
        },
        isFormValid: () => {
            // Business name and phone number must be filled
            const hasRequiredFields = businessName.trim() !== '' && 
                                      phoneNumber.trim() !== '';
                                      
            // If phone number is long enough to validate but hasn't been checked yet,
            // we're still checking, so consider form valid to allow submission
            if (phoneNumber.length >= 10 && phoneNumberAvailable === null && !isCheckingPhone) {
                // Force a check on full phone numbers that haven't been validated yet
                setPhoneNumber(phoneNumber);
            }
            
            // Form is valid if required fields are present and phone number isn't known to be invalid
            return hasRequiredFields && (phoneNumberAvailable !== false);
        }
    }));

    // Call onFormChange whenever any field changes
    useEffect(() => {
        if (onFormChange) {
            onFormChange();
        }
    }, [businessName, firstName, lastName, phoneNumber]);
    
    // Trigger initial form validation when component mounts
    useEffect(() => {
        if (onFormChange) {
            onFormChange();
        }
    }, []);

    // ... (rest of component logic)

    // Example: Call this after successful business creation (pseudo-code)
    const handleCreateBusiness = async () => {
        // ... your creation logic (API call, Redux dispatch, etc.)
        // Assume creation is successful:
        if (onBusinessCreated) {
            onBusinessCreated();
        }
        if (onCloseModal) {
            onCloseModal();
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.label}>Business Name*</Text>
            <TextInput
                placeholder="Enter business name"
                value={businessName}
                onChangeText={setBusinessName}
                style={styles.input}
                placeholderTextColor="#A0A0A0"
            />

            <Text style={styles.label}>First Name</Text>
            <TextInput
                placeholder="Enter first name"
                value={firstName}
                onChangeText={setFirstName}
                style={styles.input}
                placeholderTextColor="#A0A0A0"
            />

            <Text style={styles.label}>Last Name</Text>
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
                style={[
                    styles.input,
                    phoneNumberAvailable === true && styles.validInput,
                    phoneNumberAvailable === false && styles.invalidInput
                ]}
                keyboardType="phone-pad"
                placeholderTextColor="#A0A0A0"
            />
            {phoneNumber.length >= 10 && (
                <Text style={getPhoneInputStyle(
                    styles.statusText,
                    styles.available,
                    styles.unavailable,
                    styles.checking
                )}>
                    {getPhoneStatusText(
                        "Checking availability...",
                        "Phone number is available",
                        "Phone number is already in use"
                    )}
                </Text>
            )}
            
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
    },
    validInput: {
        borderColor: '#4CAF50',  // Green for valid
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
    },
    invalidInput: {
        borderColor: '#E53935',  // Red for invalid
        backgroundColor: 'rgba(229, 57, 53, 0.1)',
    },
    statusText: {
        fontSize: 12,
        marginTop: -10,
        marginBottom: 10,
        textAlign: 'right'
    },
    available: {
        color: '#4CAF50', // Green
    },
    unavailable: {
        color: '#E53935', // Red
    },
    checking: {
        color: '#0000ff', // Blue
    }
});

export default BusinessForm;