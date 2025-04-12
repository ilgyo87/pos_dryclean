import { useEffect, useState } from "react";
import { StyleSheet, View, Text, TextInput } from "react-native";
import CancelResetCreateButtons from "../../../components/CancelResetCreateButtons";
import type { Schema } from "../../../../amplify/data/resource";
import { generateClient } from "aws-amplify/data";

const client = generateClient<Schema>();

export default function CustomerForm({ onCloseModal, createOrEdit, params }: { onCloseModal: () => void, createOrEdit: 'create' | 'edit', params: Record<string, any> }) {
    const existingCustomer = createOrEdit === 'edit' ? params?.customer : null;
    const [firstName, setFirstName] = useState(existingCustomer?.firstName || '');
    const [lastName, setLastName] = useState(existingCustomer?.lastName || '');
    const [email, setEmail] = useState(existingCustomer?.email || '');
    const [phoneNumber, setPhoneNumber] = useState(existingCustomer?.phoneNumber || '');
    const [address, setAddress] = useState(existingCustomer?.address || '');
    const [city, setCity] = useState(existingCustomer?.city || '');
    const [state, setState] = useState(existingCustomer?.state || '');
    const [zipCode, setZipCode] = useState(existingCustomer?.zipCode || '');
    const [phoneNumberAvailable, setPhoneNumberAvailable] = useState<boolean | null>(null);
    const [isFormValid, setIsFormValid] = useState(false);

    useEffect(() => {
        const checkPhoneNumberAvailability = async () => {
            // Skip validation if in edit mode
            if (createOrEdit === 'edit') {
                setPhoneNumberAvailable(true);
                return;
            }

            if (phoneNumber?.length === 10) {
                try {
                    const { data, errors } = await client.models.Customer.list();
                    if (data && !errors) {
                        const isAvailable = !data.map(c => c.phoneNumber).includes(phoneNumber);
                        setPhoneNumberAvailable(isAvailable);
                    } else {
                        console.error('Error checking phone number availability:', errors);
                        setPhoneNumberAvailable(null);
                    }
                } catch (error) {
                    console.error('Error checking phone number availability:', error);
                    setPhoneNumberAvailable(null);
                }
            } else {
                setPhoneNumberAvailable(null);
            }
        };
        checkPhoneNumberAvailability();
    }, [phoneNumber, createOrEdit]);

    useEffect(() => {
        const isValid =
            firstName.trim().length > 0 &&
            lastName.trim().length > 0 &&
            phoneNumber.length === 10 &&
            (createOrEdit === 'edit' || phoneNumberAvailable === true);

        setIsFormValid(isValid);
    }, [firstName, lastName, phoneNumber, phoneNumberAvailable, createOrEdit]);

    const resetForm = () => {
        setFirstName('');
        setLastName('');
        setEmail('');
        setPhoneNumber('');
        setAddress('');
    };

    const formatPhoneNumber = (text: string) => {
        // Remove all non-numeric characters
        const cleaned = text.replace(/\D/g, '');
        setPhoneNumber(cleaned);
    };

    return (
        <View style={styles.container}>
            <View style={styles.formContainer}>
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
                    placeholder="Enter phone number"
                    value={phoneNumber}
                    onChangeText={formatPhoneNumber}
                    style={[
                        styles.input,
                        // Only apply validation styling in create mode
                        createOrEdit === 'create' && phoneNumberAvailable === true && styles.validInput,
                        createOrEdit === 'create' && phoneNumberAvailable === false && styles.invalidInput
                    ]}
                    keyboardType="phone-pad"
                    maxLength={10}
                    placeholderTextColor="#A0A0A0"
                />
                {/* Only show availability message in create mode */}
                {createOrEdit === 'create' && phoneNumberAvailable !== null && (
                    <Text
                        style={
                            phoneNumberAvailable
                                ? styles.availabilityTextAvailable
                                : styles.availabilityTextNotAvailable
                        }
                    >
                        {phoneNumberAvailable
                            ? "Phone number is available"
                            : "Phone number is already in use"}
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

                <Text style={styles.label}>Address</Text>
                <TextInput
                    placeholder="Enter address"
                    value={address}
                    onChangeText={setAddress}
                    style={styles.input}
                    multiline={true}
                    numberOfLines={3}
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
                    placeholderTextColor="#A0A0A0"
                />
            </View>


            <View style={styles.buttonContainer}>
                <CancelResetCreateButtons
                    onCloseModal={onCloseModal}
                    entityName="Customer"
                    params={{
                        firstName,
                        lastName,
                        phoneNumber,
                        address,
                        city,
                        state,
                        zipCode,
                        email,
                        userId: params.userId
                    }}
                    onResetForm={resetForm}
                    isFormValid={isFormValid}
                    createOrEdit={createOrEdit}
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
        borderColor: '#E53935',  // Red for invalid
        backgroundColor: 'rgba(229, 57, 53, 0.1)',
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