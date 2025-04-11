import { useEffect, useState } from "react";
import { StyleSheet, View, Text, TextInput, Platform, Alert } from "react-native";
import BusinessButtons from "./BusinessButtons";
import type { Schema } from "../../amplify/data/resource";
import { generateClient } from "aws-amplify/data";

const client = generateClient<Schema>();

export default function BusinessForm({ userId, onCloseModal }: { userId: string, onCloseModal: () => void }) {
    const [businessName, setBusinessName] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [phoneNumberAvailable, setPhoneNumberAvailable] = useState<boolean | null>(null);

    const businessPhoneNumbers = client.queries.fetchAllBusinesses();

    useEffect(() => {
        const checkPhoneNumberAvailability = async () => {
            if (phoneNumber?.length === 10) {
                try {
                    const response = await businessPhoneNumbers;
                    const isAvailable = !response.data?.includes(phoneNumber);
                    setPhoneNumberAvailable(isAvailable);
                } catch (error) {
                    console.error('Error checking phone number availability:', error);
                    setPhoneNumberAvailable(null);
                }
            } else {
                setPhoneNumberAvailable(null);
            }
        };
        checkPhoneNumberAvailability();
    }, [phoneNumber]);

    const resetForm = () => {
        setBusinessName('');
        setFirstName('');
        setLastName('');
        setPhoneNumber('');
    };

    return (
        <View style={styles.container}>
            <View style={styles.formContainer}>
                <Text style={styles.label}>Business Name</Text>
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

                <Text style={styles.label}>Phone Number</Text>
                <TextInput
                    placeholder="Enter phone number (e.g., 5551234567)"
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    keyboardType="phone-pad"
                    autoComplete={Platform.OS === 'ios' ? 'tel' : 'tel-national'}
                    maxLength={15}
                    style={[
                        styles.input,
                        phoneNumberAvailable === true && styles.validInput,
                        phoneNumberAvailable === false && styles.invalidInput
                    ]}
                    placeholderTextColor="#A0A0A0"
                />
                {phoneNumber && phoneNumber.length === 10 && phoneNumberAvailable !== null && (
                    <Text style={phoneNumberAvailable ? styles.availabilityTextAvailable : styles.availabilityTextNotAvailable}>
                        {phoneNumberAvailable ? 'Available' : 'Not Available'}
                    </Text>
                )}
            </View>
            <View style={styles.buttonContainer}>
                <BusinessButtons
                    onCloseModal={onCloseModal}
                    userId={userId}
                    businessName={businessName}
                    firstName={firstName}
                    lastName={lastName}
                    phoneNumber={phoneNumber}
                    onResetForm={resetForm}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
        width: '100%',
    },
    formContainer: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
        color: '#333',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 5,
        padding: 10,
        marginBottom: 15,
        fontSize: 16,
    },
    validInput: {
        borderColor: '#4CAF50',  // Green for valid
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
    },
    invalidInput: {
        borderColor: '#F44336',  // Red for invalid
        backgroundColor: 'rgba(244, 67, 54, 0.1)',
    },
    inputError: {
        borderColor: '#FF5252',
    },
    buttonContainer: {
        borderRadius: 12,
        padding: 16,
        marginTop: 10,
    },
    availabilityText: {
        marginTop: 4,
        fontSize: 12,
        marginRight: 5,
        textAlign: 'right'
    },
    availabilityTextAvailable: {
        color: '#4CAF50', // Green
        fontSize: 12,
        marginRight: 5,
        textAlign: 'right'
    },
    availabilityTextNotAvailable: {
        color: '#E53935', // Red
        fontSize: 12,
        marginRight: 5,
        textAlign: 'right'
    },
});