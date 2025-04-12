// src/screens/Employees/components/EmployeeForm.tsx
import { useEffect, useState } from "react";
import { StyleSheet, View, Text, TextInput, Alert, Platform, ScrollView, Pressable } from "react-native";
import CancelResetCreateButtons from "../../../components/CancelResetCreateButtons";
import type { Schema } from "../../../../amplify/data/resource";
import { generateClient } from "aws-amplify/data";

const client = generateClient<Schema>();

export default function EmployeeForm({ onCloseModal, createOrEdit, params }: { onCloseModal: () => void, createOrEdit: 'create' | 'edit', params: Record<string, any> }) {
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
    const [isFormValid, setIsFormValid] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const { createEmployee, updateEmployee, deleteEmployee } = params;

    const roles = ["STAFF", "MANAGER", "ADMIN", "CLEANER", "PRESSER", "CUSTOMER_SERVICE", "DRIVER"];
    const statuses = ["ACTIVE", "INACTIVE", "ON_LEAVE"];

    useEffect(() => {
        const isValid =
            firstName.trim().length > 0 &&
            lastName.trim().length > 0 &&
            phoneNumber.length === 10 &&
            role.trim().length > 0;

        setIsFormValid(isValid);
    }, [firstName, lastName, phoneNumber, role]);

    const resetForm = () => {
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
        (text: string) => setter(text);

    const handleCreateOrUpdate = async (formData: any) => {
        setIsLoading(true);
        try {
            // Format hourly rate from string to number
            const hourlyRateValue = hourlyRate && hourlyRate.trim() !== '' 
                ? parseFloat(hourlyRate) 
                : undefined;
            
            // Use the data passed from the component or build it from state
            const employeeData = {
                ...formData,
                hourlyRate: hourlyRateValue,
                hireDate: formData.hireDate || new Date().toISOString()
            };

            // Call the appropriate function and wait for the result
            if (createOrEdit === 'edit') {
                await updateEmployee(employeeData);
            } else {
                await createEmployee(employeeData);
            }
            
            // If we reach here without errors, it was successful
            console.log(`Employee ${createOrEdit === 'edit' ? 'updated' : 'created'} successfully`);
            Alert.alert("Success", `Employee ${createOrEdit === 'edit' ? 'updated' : 'created'} successfully!`);
            // Close the modal
            onCloseModal();
        } catch (error) {
            console.error(`Error ${createOrEdit === 'edit' ? 'updating' : 'creating'} employee:`, error);
            Alert.alert("Error", `Failed to ${createOrEdit === 'edit' ? 'update' : 'create'} employee.`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (data: any) => {
        try {
            await deleteEmployee(data);
            return Promise.resolve();
        } catch (error) {
            console.error("Error deleting employee:", error);
            return Promise.reject(error);
        }
    };

    return (
        <ScrollView style={styles.scrollContainer}>
            <View style={styles.container}>
                <View style={styles.formContainer}>
                    <Text style={styles.label}>First Name*</Text>
                    <TextInput
                        placeholder="Enter first name"
                        value={firstName}
                        onChangeText={handleTextChange(setFirstName)}
                        style={styles.input}
                        placeholderTextColor="#A0A0A0"
                    />

                    <Text style={styles.label}>Last Name*</Text>
                    <TextInput
                        placeholder="Enter last name"
                        value={lastName}
                        onChangeText={handleTextChange(setLastName)}
                        style={styles.input}
                        placeholderTextColor="#A0A0A0"
                    />

                    <Text style={styles.label}>Phone Number*</Text>
                    <TextInput
                        placeholder="Enter phone number"
                        value={phoneNumber}
                        onChangeText={formatPhoneNumber}
                        style={styles.input}
                        keyboardType="phone-pad"
                        maxLength={10}
                        placeholderTextColor="#A0A0A0"
                    />

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

                    <Text style={styles.label}>Role*</Text>
                    <View style={styles.radioContainer}>
                        {roles.map((roleOption) => (
                            <Pressable
                                key={roleOption}
                                style={styles.radioOption}
                                onPress={() => setRole(roleOption)}
                            >
                                <View style={[styles.radioCircle, role === roleOption && styles.radioSelected]}>
                                    {role === roleOption && <View style={styles.radioDot} />}
                                </View>
                                <Text style={styles.radioLabel}>{roleOption.replace('_', ' ')}</Text>
                            </Pressable>
                        ))}
                    </View>

                    <Text style={styles.label}>Status</Text>
                    <View style={styles.radioContainer}>
                        {statuses.map((statusOption) => (
                            <Pressable
                                key={statusOption}
                                style={styles.radioOption}
                                onPress={() => setStatus(statusOption)}
                            >
                                <View style={[styles.radioCircle, status === statusOption && styles.radioSelected]}>
                                    {status === statusOption && <View style={styles.radioDot} />}
                                </View>
                                <Text style={styles.radioLabel}>{statusOption.replace('_', ' ')}</Text>
                            </Pressable>
                        ))}
                    </View>

                    <Text style={styles.label}>Hourly Rate ($)</Text>
                    <TextInput
                        placeholder="Enter hourly rate"
                        value={hourlyRate}
                        onChangeText={handleTextChange(setHourlyRate)}
                        style={styles.input}
                        keyboardType="decimal-pad"
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
                        entityType="Employee"
                        isEdit={createOrEdit === 'edit'}
                        data={{
                            id: existingEmployee?.id,
                            firstName,
                            lastName,
                            phoneNumber,
                            email,
                            role,
                            hourlyRate,
                            status,
                            address,
                            city,
                            state,
                            zipCode,
                            userId: params.userId
                        }}
                        onDelete={createOrEdit === 'edit' ? handleDelete : undefined}
                    />
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    scrollContainer: {
        maxHeight: '80%',
    },
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
    radioContainer: {
        marginBottom: 15,
    },
    radioOption: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    radioCircle: {
        height: 20,
        width: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#2089dc',
        alignItems: 'center',
        justifyContent: 'center',
    },
    radioSelected: {
        borderColor: '#2089dc',
    },
    radioDot: {
        height: 10,
        width: 10,
        borderRadius: 5,
        backgroundColor: '#2089dc',
    },
    radioLabel: {
        marginLeft: 8,
        fontSize: 16,
        color: '#333',
    },
    buttonContainer: {
        marginTop: 10,
    },
});