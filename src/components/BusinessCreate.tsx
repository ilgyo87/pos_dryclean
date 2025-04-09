import {
    View,
    Text,
    Modal,
    TextInput,
    Pressable,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView
} from "react-native";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../amplify/data/resource";
import { useEffect, useState, useCallback, useMemo } from "react";
import { styles } from "../componentStyles/BusinessCreateStyles";
import { AuthUser } from 'aws-amplify/auth';
import Icon from 'react-native-vector-icons/FontAwesome';

const client = generateClient<Schema>();

interface BusinessCreateProps {
    isVisible: boolean;
    user: AuthUser | null;
    onCloseModal: () => void;
}

// Debounce function (moved outside component for stability)
const debounce = (func: (...args: any[]) => void, delay: number) => {
    let timeoutId: NodeJS.Timeout | null = null;
    return (...args: any[]) => {
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func(...args);
        }, delay);
    };
};

export default function BusinessCreate({ isVisible, user, onCloseModal }: BusinessCreateProps) {
    const [businessName, setBusinessName] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');

    const [isFormValid, setIsFormValid] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [phoneError, setPhoneError] = useState('');
    const [isCheckingPhone, setIsCheckingPhone] = useState(false);
    const [isPhoneAvailable, setIsPhoneAvailable] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    // Check if form has unsaved changes
    const hasUnsavedChanges = useCallback(() => {
        return businessName !== '' ||
            firstName !== '' ||
            lastName !== '' ||
            phoneNumber !== '';
    }, [businessName, firstName, lastName, phoneNumber]);

    // Update hasChanges state when form fields change
    useEffect(() => {
        setHasChanges(hasUnsavedChanges());
    }, [businessName, firstName, lastName, phoneNumber, hasUnsavedChanges]);

    const resetForm = useCallback(() => {
        console.log("Resetting form...");
        setBusinessName('');
        setFirstName('');
        setLastName('');
        setPhoneNumber('');
        setIsFormValid(false);
        setPhoneError('');
        setIsLoading(false);
        setIsCheckingPhone(false);
        setIsPhoneAvailable(false);
        setHasChanges(false);
    }, []);

    const checkPhoneNumberAvailability = useCallback(async (phone: string) => {
        if (!user) return;
        if (phone.length !== 10) {
            setIsPhoneAvailable(false);
            setPhoneError('');
            setIsCheckingPhone(false);
            return;
        }
        setIsCheckingPhone(true);
        setPhoneError('');
        setIsPhoneAvailable(false);

        console.log(`Debounced Check: Checking for existing business with phone: ${phone}`);
        try {
            const { data: existingBusinesses, errors: listErrors } = await client.models.Business.list({
                filter: {
                    phoneNumber: { eq: phone }
                }
            });

            if (listErrors) {
                console.error("Debounced Check Error:", listErrors);
                setPhoneError("Could not verify phone number.");
            } else if (existingBusinesses && existingBusinesses.length > 0) {
                console.log("Debounced Check: Phone number already exists.");
                setPhoneError("Phone number already in use.");
                setIsPhoneAvailable(false);
            } else {
                console.log("Debounced Check: Phone number is available.");
                setIsPhoneAvailable(true);
                setPhoneError('');
            }
        } catch (error) {
            console.error('Debounced Check Exception:', error);
            setPhoneError("Error checking phone number.");
            setIsPhoneAvailable(false);
        } finally {
            setIsCheckingPhone(false);
        }
    }, [user]);

    // Create a debounced version of the check function using useCallback
    const debouncedCheckPhoneNumber = useMemo(
        () => debounce(checkPhoneNumberAvailability, 1000),
        [checkPhoneNumberAvailability]
    );

    const formatPhoneNumber = (text: string) => {
        const cleaned = text.replace(/\D/g, '');
        const truncatedCleaned = cleaned.slice(0, 10);

        let formatted = '';
        if (truncatedCleaned.length === 0) {
            formatted = '';
        } else if (truncatedCleaned.length <= 3) {
            formatted = `(${truncatedCleaned})`;
        } else if (truncatedCleaned.length <= 6) {
            formatted = `(${truncatedCleaned.slice(0, 3)}) ${truncatedCleaned.slice(3)}`;
        } else {
            formatted = `(${truncatedCleaned.slice(0, 3)}) ${truncatedCleaned.slice(3, 6)}-${truncatedCleaned.slice(6, 10)}`;
        }

        setPhoneNumber(formatted);
        setIsPhoneAvailable(false);
        setPhoneError('');

        if (truncatedCleaned.length === 10) {
            debouncedCheckPhoneNumber(truncatedCleaned);
        } else {
            setIsCheckingPhone(false);
            setIsPhoneAvailable(false);
        }
    };

    useEffect(() => {
        const cleanedPhone = phoneNumber.replace(/\D/g, '');
        const isValid = businessName.trim() !== '' &&
            firstName.trim() !== '' &&
            lastName.trim() !== '' &&
            cleanedPhone.length === 10 &&
            isPhoneAvailable &&
            !isCheckingPhone &&
            !isLoading;
        setIsFormValid(isValid);
    }, [businessName, firstName, lastName, phoneNumber, isPhoneAvailable, isCheckingPhone, isLoading]);

    const createBusiness = async () => {
        if (!isFormValid || !user) {
            console.log("Submit validation failed:", { isFormValid, userExists: !!user });
            if (!user) Alert.alert("Error", "User session not found. Please log in again.");
            else if (phoneNumber.replace(/\D/g, '').length !== 10) setPhoneError("Phone number must be 10 digits.");
            else if (!isPhoneAvailable) setPhoneError("Phone number is not available or not verified.");
            return;
        }

        setIsLoading(true);
        const cleanedPhone = phoneNumber.replace(/\D/g, '');

        try {
            console.log("Attempting to create business...");
            const { data: newBusiness, errors: createErrors } = await client.models.Business.create({
                name: businessName.trim(),
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                phoneNumber: cleanedPhone,
                userId: user.userId,
            });

            if (createErrors) {
                console.error("Error creating business:", createErrors);
                Alert.alert("Error", `Failed to create business: ${createErrors[0].message || 'Please try again.'}`);
                setIsLoading(false);
            } else if (newBusiness) {
                console.log("Business created successfully:", newBusiness);
                Alert.alert("Success", "Business created successfully!");
                resetForm();
                onCloseModal();
            }
        } catch (error: any) {
            console.error('Error during business creation process:', error);
            Alert.alert("Error", `An unexpected error occurred: ${error.message || 'Please try again.'}`);
            setIsLoading(false);
        }
    };

    // Confirm before closing if user has unsaved changes
    const handleCancel = () => {
        console.log("Cancel button pressed");
        if (hasChanges) {
            Alert.alert(
                "Discard changes?",
                "You have unsaved changes. Are you sure you want to close this form?",
                [
                    { text: "Keep Editing", style: "cancel" },
                    { text: "Discard", onPress: () => onCloseModal() }
                ]
            );
        } else {
            onCloseModal();
        }
    };

    // Handle Android back button
    const handleBackPress = () => {
        handleCancel();
        return true; // Prevents the modal from closing immediately
    };

    // Effect to reset form when modal becomes hidden
    useEffect(() => {
        if (!isVisible) {
            const timer = setTimeout(() => {
                resetForm();
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [isVisible, resetForm]);

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={isVisible}
            onRequestClose={handleBackPress}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.centeredView}
            >
                <View style={styles.modalView}>
                    <ScrollView contentContainerStyle={styles.scrollContainer}>
                        <Text style={styles.modalTitle}>Create New Business</Text>

                        <TextInput
                            style={styles.input}
                            placeholder="Business Name"
                            value={businessName}
                            onChangeText={setBusinessName}
                            editable={!isLoading && !isCheckingPhone}
                            autoCapitalize="words"
                            accessible={true}
                            accessibilityLabel="Business Name"
                            accessibilityHint="Enter the name of your business"
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Owner's First Name"
                            value={firstName}
                            onChangeText={setFirstName}
                            editable={!isLoading && !isCheckingPhone}
                            autoCapitalize="words"
                            accessible={true}
                            accessibilityLabel="Owner's First Name"
                            accessibilityHint="Enter the first name of the business owner"
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Owner's Last Name"
                            value={lastName}
                            onChangeText={setLastName}
                            editable={!isLoading && !isCheckingPhone}
                            autoCapitalize="words"
                            accessible={true}
                            accessibilityLabel="Owner's Last Name"
                            accessibilityHint="Enter the last name of the business owner"
                        />

                        <View style={styles.phoneInputContainer}>
                            <TextInput
                                style={[
                                    styles.inputPhone,
                                    phoneError ? styles.inputError : null,
                                    isPhoneAvailable ? styles.inputPhoneAvailable : null
                                ]}
                                placeholder="Phone Number (XXX) XXX-XXXX"
                                value={phoneNumber}
                                onChangeText={formatPhoneNumber}
                                keyboardType="phone-pad"
                                editable={!isLoading && !isCheckingPhone}
                                accessible={true}
                                accessibilityLabel="Phone Number"
                                accessibilityHint="Enter the business phone number"
                            />
                            {isCheckingPhone && (
                                <ActivityIndicator
                                    size="small"
                                    color="#007bff"
                                    style={styles.checkmarkIcon}
                                    accessibilityLabel="Checking phone number availability"
                                />
                            )}
                            {isPhoneAvailable && !isCheckingPhone && !phoneError && (
                                <Text style={styles.checkmarkIcon} accessible={true} accessibilityLabel="Phone number is available">
                                    <Icon name="check-circle"/>
                                </Text>
                            )}
                        </View>
                        {phoneError ? (
                            <Text
                                style={styles.errorText}
                                accessible={true}
                                accessibilityLabel={`Error: ${phoneError}`}
                            >
                                {phoneError}
                            </Text>
                        ) : null}

                        <View style={styles.buttonContainer}>
                            {/* Cancel Button */}
                            <Pressable
                                style={[styles.button, styles.buttonCancel]}
                                onPress={handleCancel}
                                disabled={isLoading}
                                accessible={true}
                                accessibilityLabel="Cancel"
                                accessibilityHint="Cancel creating a business"
                                accessibilityRole="button"
                            >
                                <Text style={styles.textStyleCancel}>Cancel</Text>
                            </Pressable>

                            {/* Reset Button */}
                            <Pressable
                                style={[styles.button, styles.buttonReset]}
                                onPress={resetForm}
                                disabled={isLoading || isCheckingPhone}
                                accessible={true}
                                accessibilityLabel="Reset"
                                accessibilityHint="Reset all form fields"
                                accessibilityRole="button"
                            >
                                <Text style={styles.textStyle}>Reset</Text>
                            </Pressable>

                            {/* Submit Button */}
                            <Pressable
                                style={[
                                    styles.button,
                                    styles.buttonSubmit,
                                    (!isFormValid || isLoading || isCheckingPhone) ? styles.buttonDisabled : null
                                ]}
                                onPress={createBusiness}
                                disabled={!isFormValid || isLoading || isCheckingPhone}
                                accessible={true}
                                accessibilityLabel="Submit"
                                accessibilityHint="Create a new business with the provided information"
                                accessibilityRole="button"
                            >
                                {isLoading ? (
                                    <ActivityIndicator
                                        size="small"
                                        color="#ffffff"
                                        accessibilityLabel="Loading"
                                    />
                                ) : (
                                    <Text style={styles.textStyle}>Submit</Text>
                                )}
                            </Pressable>
                        </View>
                    </ScrollView>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}