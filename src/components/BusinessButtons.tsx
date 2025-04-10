import { Alert, StyleSheet, TouchableOpacity, Text, View } from "react-native";
import createBusiness from "../hooks/businessHooks";
import { useState } from "react";
import type { BusinessButtonsProps } from "../types";

export default function BusinessButtons({
    onCloseModal,
    userId,
    businessName,
    firstName,
    lastName,
    phoneNumber,
    onResetForm
}: BusinessButtonsProps) {
    const [qrCode, setQrCode] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleCreateBusiness = async () => {
        const business = await createBusiness(userId, businessName, firstName, lastName, phoneNumber, qrCode);
        if (business == null) {
            Alert.alert("Error", "Failed to create business");
            return;
        }
        Alert.alert("Success", "Business created successfully");
        onCloseModal();
        setIsSubmitting(false);
    };


    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={onCloseModal}
                disabled={isSubmitting}
            >
                <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.button, styles.resetButton]}
                onPress={onResetForm}
                disabled={isSubmitting}
            >
                <Text style={styles.buttonText}>Reset</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.button, styles.createButton, isSubmitting && styles.disabledButton]}
                onPress={handleCreateBusiness}
                disabled={isSubmitting}
            >
                <Text style={styles.buttonText}>
                    {isSubmitting ? "Creating..." : "Create"}
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