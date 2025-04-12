import { useEffect, useState } from "react";
import { StyleSheet, View, Text, TextInput, Alert, Platform, KeyboardTypeOptions } from "react-native";
import CancelResetCreateButtons from "../../../components/CancelResetCreateButtons";
import type { Schema } from "../../../../amplify/data/resource";
import { generateClient } from "aws-amplify/data";

const client = generateClient<Schema>();

export default function CustomerForm({ onCloseModal, createOrEdit, params }: { onCloseModal: () => void, createOrEdit: 'create' | 'edit', params: Record<string, any> }) {
    const existingCustomer = createOrEdit === 'edit' ? params?.customer : null;
    const [firstName, setFirstName] = useState(existingCustomer?.firstName || '');
    const [lastName, setLastName] = useState(existingCustomer?.lastName || '');
    const [email, setEmail] = useState(existingCustomer?.email || 'none@example.com');
    const [phoneNumber, setPhoneNumber] = useState(existingCustomer?.phoneNumber || '');
    const [address, setAddress] = useState(existingCustomer?.address || '');
    const [city, setCity] = useState(existingCustomer?.city || '');
    const [state, setState] = useState(existingCustomer?.state || '');
    const [zipCode, setZipCode] = useState(existingCustomer?.zipCode || '');
    const [phoneNumberAvailable, setPhoneNumberAvailable] = useState<boolean | null>(null);
    const [isFormValid, setIsFormValid] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const { createCustomer, updateCustomer, deleteCustomer } = params;
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
        if (createOrEdit === 'edit' && existingCustomer) {
            // In edit mode, reset to the original customer data
            setFirstName(existingCustomer.firstName || '');
            setLastName(existingCustomer.lastName || '');
            setEmail(existingCustomer.email || 'none@example.com');
            setPhoneNumber(existingCustomer.phoneNumber || '');
            setAddress(existingCustomer.address || '');
            setCity(existingCustomer.city || '');
            setState(existingCustomer.state || '');
            setZipCode(existingCustomer.zipCode || '');
        } else {
            // In create mode, clear the form completely
            setFirstName('');
            setLastName('');
            setEmail('none@example.com');
            setPhoneNumber('');
            setAddress('');
            setCity('');
            setState('');
            setZipCode('');
        }
        
        // Reset the phoneNumberAvailable state if in create mode
        if (createOrEdit === 'create') {
            setPhoneNumberAvailable(null);
        }
        
        // Show confirmation to the user
        Alert.alert('Form Reset', 'The form has been reset to its initial state.');
    };

    const formatPhoneNumber = (text: string) => {
        // Remove all non-numeric characters
        const cleaned = text.replace(/\D/g, '');
        setPhoneNumber(cleaned);
    };

    const handleTextChange = (setter: React.Dispatch<React.SetStateAction<string>>) => 
        (text: string) => {
            setter(text);
        };

    const handleCreateOrUpdate = async (formData: any) => {
        setIsLoading(true);
        try {
            // Use the data passed from the component or build it from state
            const customerData = formData || {
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                phoneNumber: phoneNumber.trim(),
                email: email.trim() || 'none@example.com',
                address: address.trim() || '',
                city: city.trim() || '',
                state: state.trim() || '',
                zipCode: zipCode.trim() || '',
                userId: params.userId,
                ...(existingCustomer?.id && { id: existingCustomer.id })
            };

            // Call the appropriate function and wait for the result
            if (createOrEdit === 'edit') {
                await updateCustomer(customerData);
            } else {
                await createCustomer(customerData);
            }
            
            // If we reach here without errors, it was successful
            console.log(`Customer ${createOrEdit === 'edit' ? 'updated' : 'created'} successfully`);
            Alert.alert("Success", `Customer ${createOrEdit === 'edit' ? 'updated' : 'created'} successfully!`);
            // Close the modal
            onCloseModal();
        } catch (error) {
            console.error(`Error ${createOrEdit === 'edit' ? 'updating' : 'creating'} customer:`, error);
            Alert.alert("Error", `Failed to ${createOrEdit === 'edit' ? 'update' : 'create'} customer.`);
            // Do NOT close the modal on error or trigger a refresh
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (data: any) => {
        try {
            await deleteCustomer(data);
            return Promise.resolve();
        } catch (error) {
            console.error("Error deleting customer:", error);
            return Promise.reject(error);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.formContainer}>
                <Text style={styles.label}>First Name</Text>
                <TextInput
                    placeholder="Enter first name"
                    value={firstName}
                    onChangeText={handleTextChange(setFirstName)}
                    style={styles.input}
                    placeholderTextColor="#A0A0A0"
                />

                <Text style={styles.label}>Last Name</Text>
                <TextInput
                    placeholder="Enter last name"
                    value={lastName}
                    onChangeText={handleTextChange(setLastName)}
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
                    onChangeText={handleTextChange(setEmail)}
                    style={styles.input}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholderTextColor="#A0A0A0"
                />

                <Text style={styles.label}>Address</Text>
                <TextInput
                    placeholder="Enter address"
                    value={address}
                    onChangeText={handleTextChange(setAddress)}
                    style={styles.input}
                    multiline={true}
                    numberOfLines={3}
                    placeholderTextColor="#A0A0A0"
                />

                <Text style={styles.label}>City</Text>
                <TextInput
                    placeholder="Enter city"
                    value={city}
                    onChangeText={handleTextChange(setCity)}
                    style={styles.input}
                    placeholderTextColor="#A0A0A0"
                />

                <Text style={styles.label}>State</Text>
                <TextInput
                    placeholder="Enter state"
                    value={state}
                    onChangeText={handleTextChange(setState)}
                    style={styles.input}
                    placeholderTextColor="#A0A0A0"
                />

                <Text style={styles.label}>Zip Code</Text>
                <TextInput
                    placeholder="Enter zip code"
                    value={zipCode}
                    onChangeText={handleTextChange(setZipCode)}
                    style={styles.input}
                    placeholderTextColor="#A0A0A0"
                />
            </View>

            <View style={styles.buttonContainer}>
                <CancelResetCreateButtons
                    onCancel={onCloseModal}
                    onReset={resetForm}
                    onCreate={handleCreateOrUpdate}
                    isValid={isFormValid}
                    isLoading={isLoading}
                    entityType="Customer"
                    isEdit={createOrEdit === 'edit'}
                    data={{
                        id: existingCustomer?.id,
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
                    onDelete={createOrEdit === 'edit' ? handleDelete : undefined}
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
        marginTop: 10,
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