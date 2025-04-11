import { Alert, StyleSheet, TouchableOpacity, Text, View } from "react-native";
import { useEffect, useState } from "react";
import type { BusinessButtonsProps } from "../types";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../amplify/data/resource";
import Toast from 'react-native-toast-message';

const client = generateClient<Schema>();

export default function CancelResetCreateButtons({
    onCloseModal,
    userId,
    businessName,
    firstName,
    lastName,
    phoneNumber,
    onResetForm
}: BusinessButtonsProps) {
    const [isFormValid, setIsFormValid] = useState(true);

    useEffect(() => {
        setIsFormValid(
            businessName.trim().length > 0 &&
            firstName.trim().length > 0 &&
            lastName.trim().length > 0 &&
            phoneNumber.trim().length === 10
        );
    }, [businessName, firstName, lastName, phoneNumber]);

    const handleCancel = () => {
        Alert.alert(
            'Confirm Cancellation',
            'Are you sure you want to cancel? Any unsaved changes will be lost.',
            [
                {
                    text: 'No, Continue',
                    style: 'cancel',
                },
                {
                    text: 'Yes, Cancel',
                    onPress: onCloseModal,
                    style: 'destructive',
                },
            ]
        );
    };

    const handleCreateBusiness = async () => {
        try {
            await client.models.Business.create({
                name: businessName.trim(),
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                phoneNumber: phoneNumber.trim(),
                userId: userId
            });
        } catch (error) {
            console.error("Error creating business:", error);
            Alert.alert("Error", "Failed to create business.");
            return;
        }
        Toast.show({
            type: 'success',
            text1: 'Business Created',
            text2: `${businessName} has been created successfully!`,
            position: 'bottom',
            visibilityTime: 3000
        });
        onCloseModal();
    }

    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={handleCancel}
            >
                <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.button, styles.resetButton]}
                onPress={onResetForm}
            >
                <Text style={styles.buttonText}>Reset</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[
                    styles.button,
                    styles.createButton,
                    (!isFormValid) && styles.disabledButton
                ]}
                onPress={handleCreateBusiness}
                disabled={!isFormValid}
            >
                <Text style={styles.buttonText}>
                    Create
                </Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginTop: 20,
    },
    button: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        minWidth: 100,
        alignItems: 'center',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
    },
    resetButton: {
        backgroundColor: 'skyblue',
    },
    cancelButton: {
        backgroundColor: '#ff6b6b',
    },
    createButton: {
        backgroundColor: '#4ecdc4',
    },
    disabledButton: {
        backgroundColor: '#a0a0a0',
        opacity: 0.7,
    },
    buttonText: {
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: 16,
    }
});