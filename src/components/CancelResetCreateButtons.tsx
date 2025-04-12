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
    isFormValid,
    onEntityCreated
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
              const { data: createdBusiness, errors: businessErrors } = await client.models.Business.create(businessData);
              console.log("Business created response:", JSON.stringify(createdBusiness));
              if (businessErrors) {
                console.error("Error creating business:", businessErrors);
                throw new Error('Failed to create business');
              }
              break;
              
            case "Customer":
              const customerData = {
                firstName: params.firstName.trim(),
                lastName: params.lastName.trim(),
                phoneNumber: params.phoneNumber.trim(),
                email: params.email.trim() || 'none@example.com',
                address: params.address.trim() || '',
                city: params.city.trim() || '',
                state: params.state.trim() || '',
                zipCode: params.zipCode.trim() || '',
                userId: userId
              };
              const { data: createdCustomer, errors: customerErrors } = await client.models.Customer.create(customerData);
              console.log("Customer created response:", JSON.stringify(createdCustomer));
              if (customerErrors) {
                console.error("Error creating customer:", customerErrors);
                throw new Error('Failed to create customer');
              }
              break;
              
            case "Category":
              const categoryData = {
                name: params.name?.trim(),
                description: params.description?.trim(),
                userId: userId
              };
              const { data: createdCategory, errors: categoryErrors } = await client.models.Category.create(categoryData);
              console.log("Category created response:", JSON.stringify(createdCategory));
              if (categoryErrors) {
                console.error("Error creating category:", categoryErrors);
                throw new Error('Failed to create category');
              }
              break;
              
            case "Item":
              const itemData = {
                name: params.name?.trim(),
                price: params.price,
                categoryId: params.categoryId,
                description: params.description?.trim(),
                sku: params.sku?.trim(),
              };
              const { data: createdItem, errors: itemErrors } = await client.models.Item.create(itemData);
              console.log("Item created response:", JSON.stringify(createdItem));
              if (itemErrors) {
                console.error("Error creating item:", itemErrors);
                throw new Error('Failed to create item');
              }
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
              const { data: createdEmployee, errors: employeeErrors } = await client.models.Employee.create(employeeData);
              console.log("Employee created response:", JSON.stringify(createdEmployee));
              if (employeeErrors) {
                console.error("Error creating employee:", employeeErrors);
                throw new Error('Failed to create employee');
              }
              break;
              
            default:
              throw new Error(`Entity type "${entityName}" not supported`);
          }
          
          console.log(`${entityName} created successfully`);
          Alert.alert("Success", `${entityName} created successfully!`);
          if (onEntityCreated) {
            onEntityCreated();
          }
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