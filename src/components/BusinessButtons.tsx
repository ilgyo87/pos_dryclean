import { Alert, StyleSheet, TouchableOpacity, Text, View } from "react-native";
import { useState } from "react";
import type { BusinessButtonsProps } from "../types";
import { generateClient } from "aws-amplify/data";
import { uploadData } from 'aws-amplify/storage';
import type { Schema } from "../../amplify/data/resource";
import { QRCodeDisplay } from "./QRCodeDisplay";
import { generateQRCodeData } from "../utils/QRCodeGenerator";

const client = generateClient<Schema>();

export default function BusinessButtons({
    onCloseModal,
    userId,
    businessName,
    firstName,
    lastName,
    phoneNumber,
    onResetForm
}: BusinessButtonsProps) {
    const [showQRCode, setShowQRCode] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isFormValid, setIsFormValid] = useState(true);

    // Generate QR code data
    const generateQRCode = () => {
        const businessData = {
            id: '', // Will be filled after creation
            name: businessName,
            firstName: firstName,
            lastName: lastName,
            phoneNumber: phoneNumber,
            userId: userId
        };

        return generateQRCodeData('Business', businessData);
    };

    // Handle QR code capture
    const handleQRCapture = async (uri: string) => {
        try {
            // Convert data URI to blob
            const response = await fetch(uri);
            const blob = await response.blob();
            
            // Create unique filename for S3
            const filename = `qrcodes/Business/${Date.now()}.png`;
            
            // Upload to S3
            const result = await uploadData({
                key: filename,
                data: blob,
                options: {
                    contentType: 'image/png'
                }
            });
            
            console.log('Successfully uploaded QR code:', result);
            
            // Create business with QR code reference
            await createBusiness(filename);
            
        } catch (error) {
            console.error('Error capturing or uploading QR code:', error);
            Alert.alert('Error', 'Failed to save QR code');
            setShowQRCode(false);
            setIsSubmitting(false);
        }
    };

    // Create business in database
    const createBusiness = async (qrCodeUrl: string) => {
        try {
            const result = await client.models.Business.create({
                name: businessName.trim(),
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                phoneNumber: phoneNumber.trim(),
                userId: userId,
                qrCode: qrCodeUrl
            });

            if (result.errors) {
                throw new Error(result.errors.map(e => e.message).join(', '));
            }

            console.log('Business created successfully:', result.data);
            
            // Close QR code display and reset submission state
            setShowQRCode(false);
            setIsSubmitting(false);
            
            // Close modal
            onCloseModal();
            
        } catch (error) {
            console.error('Error creating business:', error);
            Alert.alert('Error', 'Failed to create business. Please try again.');
            setIsSubmitting(false);
            setShowQRCode(false);
        }
    };

    const handleCreateBusiness = async () => {
        // Basic form validation
        if (!businessName || !firstName || !lastName || !phoneNumber) {
            Alert.alert('Error', 'Please fill out all required fields');
            return;
        }

        setIsSubmitting(true);
        
        try {
            // Generate QR code data and show QR component for capture
            const qrValue = generateQRCode();
            setShowQRCode(true);
        } catch (error) {
            console.error("Error starting business creation:", error);
            Alert.alert("Error", "An unexpected error occurred");
            setIsSubmitting(false);
        }
    };

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

    // Render QR Code Display if needed
    if (showQRCode) {
        return (
            <QRCodeDisplay
                qrValue={generateQRCode()}
                businessName={businessName}
                onCapture={handleQRCapture}
                onClose={() => {
                    setShowQRCode(false);
                    setIsSubmitting(false);
                }}
            />
        );
    }

    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={handleCancel}
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
                style={[
                    styles.button,
                    styles.createButton,
                    (isSubmitting || !isFormValid) && styles.disabledButton
                ]}
                onPress={handleCreateBusiness}
                disabled={isSubmitting || !isFormValid}
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