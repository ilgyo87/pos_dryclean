import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { StyleSheet, View, Text, TextInput, Alert, Platform, ScrollView, Pressable, ActivityIndicator } from "react-native";

const EmployeeForm = forwardRef(({ 
  onCloseModal, 
  createOrEdit, 
  params,
  onFormChange
}: { 
  onCloseModal: () => void, 
  createOrEdit: 'create' | 'edit', 
  params: Record<string, any>,
  onFormChange?: () => void 
}, ref) => {
    const existingEmployee = createOrEdit === 'edit' ? params?.employee : null;
    const [firstName, setFirstName] = useState(existingEmployee?.firstName || '');
    const [lastName, setLastName] = useState(existingEmployee?.lastName || '');
    const [email, setEmail] = useState(existingEmployee?.email || '');
    const [phoneNumber, setPhoneNumber] = useState(existingEmployee?.phoneNumber || '');
    const [role, setRole] = useState(existingEmployee?.role || 'STAFF');
    const [hourlyRate, setHourlyRate] = useState(existingEmployee?.hourlyRate?.toString() || '');
    const [address, setAddress] = useState(existingEmployee?.address || '');
    const [city, setCity] = useState(existingEmployee?.city || '');
    const [state, setState] = useState(existingEmployee?.state || '');
    const [zipCode, setZipCode] = useState(existingEmployee?.zipCode || '');
    const [status, setStatus] = useState(existingEmployee?.status || 'ACTIVE');
    const [pinCode, setPinCode] = useState(existingEmployee?.pinCode || '');
    const [isLoading, setIsLoading] = useState(false);
    
    // Expose methods to parent via ref
    useImperativeHandle(ref, () => ({
        resetForm: () => {
            if (createOrEdit === 'edit' && existingEmployee) {
                // In edit mode, reset to the original employee data
                setFirstName(existingEmployee.firstName || '');
                setLastName(existingEmployee.lastName || '');
                setEmail(existingEmployee.email || '');
                setPhoneNumber(existingEmployee.phoneNumber || '');
                setRole(existingEmployee.role || 'STAFF');
                setHourlyRate(existingEmployee.hourlyRate?.toString() || '');
                setAddress(existingEmployee.address || '');
                setCity(existingEmployee.city || '');
                setState(existingEmployee.state || '');
                setZipCode(existingEmployee.zipCode || '');
                setStatus(existingEmployee.status || 'ACTIVE');
                setPinCode(existingEmployee.pinCode || '');
            } else {
                // In create mode, clear the form completely
                setFirstName('');
                setLastName('');
                setEmail('');
                setPhoneNumber('');
                setRole('STAFF');
                setHourlyRate('');
                setAddress('');
                setCity('');
                setState('');
                setZipCode('');
                setStatus('ACTIVE');
                setPinCode('');
            }
        }
    }));
    
    // Call onFormChange whenever any field changes
    useEffect(() => {
        if (onFormChange) {
            onFormChange();
        }
    }, [firstName, lastName, email, phoneNumber, role, hourlyRate, address, city, state, zipCode, status, pinCode]);

    // Continue with your existing component logic
    const handleCreateOrUpdate = async (formData: any) => {
        // Your existing handleCreateOrUpdate logic
    };

    return (
        <View style={styles.container}>
            <ScrollView style={styles.formContainer}>
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
                
                {/* Keep existing input fields, using direct setter functions instead of handleTextChange */}
                
                {isLoading && <ActivityIndicator size="small" color="#0000ff" />}
            </ScrollView>
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 10,
    },
    formContainer: {
        flex: 1,
    },
    label: {
        marginBottom: 5,
        fontWeight: '500',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        padding: 10,
        marginBottom: 15,
    }
    // Keep other existing styles
});

export default EmployeeForm;