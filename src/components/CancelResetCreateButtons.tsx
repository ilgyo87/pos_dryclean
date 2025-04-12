import { Alert, StyleSheet, TouchableOpacity, Text, View } from "react-native";
import { useEffect, useState } from "react";
import type { CancelResetCreateButtonsProps } from "../types";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../amplify/data/resource";
import Toast from 'react-native-toast-message';

const client = generateClient<Schema>();

export default function CancelResetCreateButtons({
    onCloseModal,
    userId,
    entityName,
    params,
    onResetForm,
    isFormValid
}: CancelResetCreateButtonsProps) {
    
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

    const handleCreateEntity = async () => {
        try {
          switch(entityName) {
            case "Business":
              const businessData = {
                name: params.businessName.trim() || '',
                phoneNumber: params.phoneNumber.trim() || '',
                firstName: params.firstName.trim() || '',
                lastName: params.lastName.trim() || '',
                userId: userId
              };
              await client.models.Business.create(businessData);
              break;
              
            case "Customer":
              const customerData = {
                firstName: params.firstName?.trim(),
                lastName: params.lastName?.trim(),
                phoneNumber: params.phoneNumber?.trim(),
                email: params.email?.trim(),
                address: params.address?.trim(),
                city: params.city?.trim(),
                state: params.state?.trim(),
                zipCode: params.zipCode?.trim(),
                userId: userId
              };
              await client.models.Customer.create(customerData);
              break;
              
            case "Category":
              const categoryData = {
                name: params.name?.trim(),
                description: params.description?.trim(),
                userId: userId
              };
              await client.models.Category.create(categoryData);
              break;
              
            case "Item":
              const itemData = {
                name: params.name?.trim(),
                price: params.price,
                categoryId: params.categoryId,
                description: params.description?.trim(),
                sku: params.sku?.trim(),
              };
              await client.models.Item.create(itemData);
              break;
              
            case "Employee":
              const employeeData = {
                firstName: params.firstName?.trim(),
                lastName: params.lastName?.trim(),
                email: params.email?.trim(),
                phoneNumber: params.phoneNumber?.trim(),
                role: params.role?.trim(),
                pin: params.pin?.trim(),
              };
              await client.models.Employee.create(employeeData);
              break;
              
            default:
              throw new Error(`Entity type "${entityName}" not supported`);
          }
          
          console.log(`${entityName} created successfully`);
          Alert.alert("Success", `${entityName} created successfully!`);
          onCloseModal();
        } catch (error) {
          console.error(`Error creating ${entityName}:`, error);
          Alert.alert("Error", `Failed to create ${entityName}.`);
        }
      };

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
                onPress={handleCreateEntity}
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