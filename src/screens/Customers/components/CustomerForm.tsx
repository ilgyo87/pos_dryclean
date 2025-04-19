// src/screens/Customers/components/CustomerForm.tsx
import React, { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { StyleSheet, View, Text, TextInput, Alert, ScrollView, ActivityIndicator } from "react-native";
import { usePhoneNumberAvailability } from "../../../components/usePhoneNumberAvailability";
import { useAppDispatch } from '../../../store/hooks';
import { createCustomer } from '../../../store/slices/CustomerSlice';
import { useSelector } from "react-redux";
import { RootState } from "../../../store";


const CustomerForm = forwardRef(({
    onCloseModal,
    createOrEdit,
    params,
    onFormChange,
    userId
}: {
    onCloseModal: () => void,
    createOrEdit: "create" | "edit",
    params: Record<string, any>,
    onFormChange?: () => void,
    userId: string // Add userId as a required prop
}, ref) => {
    // Get customer data from params or Redux state if editing
    const existingCustomer = createOrEdit === "edit" ? params?.customer : null;
    
    const [firstName, setFirstName] = useState(existingCustomer?.firstName || "");
    const [lastName, setLastName] = useState(existingCustomer?.lastName || "");
    const [email, setEmail] = useState(existingCustomer?.email || "none@example.com");
    const {
        phoneNumber,
        setPhoneNumber,
        isAvailable: phoneNumberAvailable,
        isChecking: isCheckingPhone,
        getPhoneInputStyle,
        getPhoneStatusText
    } = usePhoneNumberAvailability({
        initialPhoneNumber: existingCustomer?.phoneNumber || "",
        currentEntityId: existingCustomer?.id,
        entityType: "Customer"
    });
    const [address, setAddress] = useState(existingCustomer?.address || "");
    const [city, setCity] = useState(existingCustomer?.city || "");
    const [state, setState] = useState(existingCustomer?.state || "");
    const [zipCode, setZipCode] = useState(existingCustomer?.zipCode || "");
    const [isLoading, setIsLoading] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const dispatch = useAppDispatch();
    // Get loading state from Redux store
    const reduxLoading = useSelector((state: RootState) => state.customer.isLoading);

    // Expose the resetForm method to parent components via ref
    // Define validateAndGetFormData in scope so it can be referenced
    const validateAndGetFormData = () => {
        console.log("CustomerForm.validateAndGetFormData called");
        // Basic validation
        if (!firstName.trim()) {
            console.log("First name is required");  
            return { valid: false, message: "First name is required" };
        }
        if (!lastName.trim()) {
            console.log("Last name is required");  
            return { valid: false, message: "Last name is required" };
        }
        if (!phoneNumber.trim()) {
            console.log("Phone number is required");  
            return { valid: false, message: "Phone number is required" };
        }
        // Check if phone number is available
        if (phoneNumberAvailable === false) {
            console.log("This phone number is already in use");  
            return { valid: false, message: "This phone number is already in use" };
        }
        if (phoneNumber.length < 10 || phoneNumberAvailable === undefined) {
            console.log("Please enter a valid phone number and wait for availability check");  
            return { valid: false, message: "Please enter a valid phone number and wait for availability check" };
        }
        
        console.log("Customer validation passed");
        // Return the form data with valid flag
        return {
            firstName,
            lastName,
            email,
            phoneNumber,
            address,
            city,
            state,
            zipCode,
            valid: true, // Add valid flag for successful validation
            ...(createOrEdit === "edit" && existingCustomer?.id ? { id: existingCustomer.id } : {})
        };
    };

    // Move handleSubmit outside so it can access validateAndGetFormData
    const handleSubmit = async () => {
        setSubmitError(null);
        const formData = validateAndGetFormData();
        if (!formData || !formData.valid) {
            setSubmitError(formData?.message || 'Form is invalid');
            return;
        }
        if (createOrEdit === "create") {
            try {
                setIsLoading(true);
                await dispatch(createCustomer({ customerData: formData, userId })).unwrap();
                setIsLoading(false);
                onCloseModal(); // Optionally close modal on success
            } catch (err: any) {
                setIsLoading(false);
                setSubmitError(err?.message || 'Failed to create customer');
            }
        } else {
            // Delegate edit to parent/modal or implement update logic here
        }
    };


    useImperativeHandle(ref, () => ({
        resetForm: () => {
            if (createOrEdit === "edit" && existingCustomer) {
                // In edit mode, reset to the original customer data
                setFirstName(existingCustomer.firstName || "");
                setLastName(existingCustomer.lastName || "");
                setEmail(existingCustomer.email || "none@example.com");
                setPhoneNumber(existingCustomer.phoneNumber || "");
                setAddress(existingCustomer.address || "");
                setCity(existingCustomer.city || "");
                setState(existingCustomer.state || "");
                setZipCode(existingCustomer.zipCode || "");
            } else {
                // In create mode, clear the form completely
                setFirstName("");
                setLastName("");
                setEmail("none@example.com");
                setPhoneNumber("");
                setAddress("");
                setCity("");
                setState("");
                setZipCode("");
            }
        },
        validateAndGetFormData,
        handleSubmit: handleSubmit,
        isPhoneNumberValid: () => {
            return phoneNumberAvailable === true;
        },
        isFormValid: () => {
            // Special case: If form is completely untouched, return true
            // to keep buttons enabled at start
            if (phoneNumber.trim() === "" && 
                firstName.trim() === "" && 
                lastName.trim() === "") {
                return true;
            }
            
            // Required fields validation
            const hasRequiredFields =
                firstName.trim() !== "" &&
                lastName.trim() !== "" &&
                phoneNumber.trim() !== "";
        
            // Phone validation
            let isPhoneValid = true;
            if (phoneNumber.length >= 10) {
                isPhoneValid = phoneNumberAvailable !== false;
            } else if (phoneNumber.length > 0) {
                // Only disable when they've started typing a phone number
                // but haven't finished yet
                isPhoneValid = false;
            }
        
            return hasRequiredFields && isPhoneValid;
        }
    }));

    // Update loading state from Redux
    useEffect(() => {
        setIsLoading(reduxLoading);
    }, [reduxLoading]);

    // Notify parent component when form changes
    useEffect(() => {
        if (onFormChange) {
            onFormChange();
        }
    }, [firstName, lastName, email, phoneNumber, address, city, state, zipCode]);

    return (
        <View style={styles.container}>
            <ScrollView style={styles.formContainer}>
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

                <Text style={styles.label}>Email</Text>
                <TextInput
                    placeholder="Enter email address"
                    value={email}
                    onChangeText={setEmail}
                    style={styles.input}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholderTextColor="#A0A0A0"
                />

                <Text style={styles.label}>Address</Text>
                <TextInput
                    placeholder="Enter street address"
                    value={address}
                    onChangeText={setAddress}
                    style={styles.input}
                    placeholderTextColor="#A0A0A0"
                />

                <Text style={styles.label}>City</Text>
                <TextInput
                    placeholder="Enter city"
                    value={city}
                    onChangeText={setCity}
                    style={styles.input}
                    placeholderTextColor="#A0A0A0"
                />

                <Text style={styles.label}>State</Text>
                <TextInput
                    placeholder="Enter state"
                    value={state}
                    onChangeText={setState}
                    style={styles.input}
                    placeholderTextColor="#A0A0A0"
                />

                <Text style={styles.label}>Zip Code</Text>
                <TextInput
                    placeholder="Enter zip code"
                    value={zipCode}
                    onChangeText={setZipCode}
                    style={styles.input}
                    keyboardType="numeric"
                    placeholderTextColor="#A0A0A0"
                />

                {isLoading && <ActivityIndicator size="small" color="#0000ff" />}
                {submitError && <Text style={{ color: '#E53935', marginBottom: 8 }}>{submitError}</Text>}
            </ScrollView>
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        width: "100%",
    },
    formContainer: {
        flex: 1,
        width: "100%",
        alignSelf: "stretch",
    },
    label: {
        marginBottom: 5,
        fontWeight: "500",
    },
    input: {
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 5,
        padding: 10,
        marginBottom: 15,
        width: "100%",
        alignSelf: "stretch",
    },
    validInput: {
        borderColor: "#4CAF50",  // Green for valid
        backgroundColor: "rgba(76, 175, 80, 0.1)",
    },
    invalidInput: {
        borderColor: "#E53935",  // Red for invalid
        backgroundColor: "rgba(229, 57, 53, 0.1)",
    },
    statusText: {
        fontSize: 12,
        marginRight: 5,
        textAlign: "right"
    },
    available: {
        color: "#4CAF50", // Green
    },
    unavailable: {
        color: "#E53935", // Red
    },
    checking: {
        color: "#0000ff", // Blue
    }
});

export default CustomerForm;