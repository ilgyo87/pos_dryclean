import { useState } from "react";
import { StyleSheet, View, Text, TextInput, Platform } from "react-native";
import BusinessButtons from "./BusinessButtons";

export default function BusinessForm({ userId, onCloseModal }: { userId: string, onCloseModal: () => void }) {
    const [businessName, setBusinessName] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [qrCode, setQrCode] = useState('');

    const resetForm = () => {
        setBusinessName('');
        setFirstName('');
        setLastName('');
        setPhoneNumber('');
        setQrCode('');
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
                    style={styles.input}
                    placeholderTextColor="#A0A0A0"
                />
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
        height: 50,
        borderColor: '#E0E0E0',
        borderWidth: 1,
        borderRadius: 8,
        marginBottom: 16,
        width: '100%',
        paddingHorizontal: 12,
        fontSize: 16,
        backgroundColor: '#F9F9F9',
    },
    inputError: {
        borderColor: '#FF5252',
    },
    buttonContainer: {
        borderRadius: 12,
        padding: 16,
        marginTop: 10,
    }
});