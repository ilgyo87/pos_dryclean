// src/components/Customers/CustomerForm.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Alert } from 'react-native';
import { useAvailability } from '../../../hooks/useAvailability';
import FormModal from './../../../components/FormModal';
import CrudButtons from './../../../components/CrudButtons';
import { PhoneInput } from './../../../components/PhoneInput';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../../amplify/data/resource';
import { useAuthenticator } from '@aws-amplify/ui-react-native';
import { addCustomer } from '../../../localdb/services/customerService';
import type { Customer } from '../../../types';

// Amplify API client
const client = generateClient<Schema>();

interface CustomerFormProps {
    visible: boolean;
    userId?: string;
    onClose: () => void;
    onSuccess?: () => void;
}

const initialState = {
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
};

const CustomerForm: React.FC<CustomerFormProps> = ({
    visible,
    userId,
    onClose,
    onSuccess
}) => {
    const [form, setForm] = useState(initialState);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { user: authUser } = useAuthenticator((context) => [context.user]);
    const phoneAvailability = useAvailability(
        form.phone.replace(/\D/g, '').length >= 10 ? form.phone : '',
        async (val: string) => {
            try {
                const cleanedInput = (val || '').replace(/\D/g, '');
                if (cleanedInput.length < 10) return false; // Not enough digits, not taken
                const { getAllCustomers } = await import('../../../localdb/services/customerService');
                const all = await getAllCustomers();
                const arr = Array.from(all)
                    .map((c: any) => (c.phone ? c.phone.replace(/\D/g, '') : ''))
                    .filter((p: string) => p.length > 0);
                return arr.includes(cleanedInput);
            } catch (err) {
                console.error('Phone check error:', err);
                return false; // fallback: not taken
            }
        }
    );


    const handleChange = (field: keyof typeof initialState, value: string) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const handleReset = () => {
        setForm(initialState);
        setError(null);
    };

    const handleCreate = async () => {
        // Validate required fields
        if (!form.firstName || !form.lastName || !form.phone) {
            setError('First name, last name, and phone are required');
            return;
        }

        try {
            setLoading(true);
            setError(null);

            // Create customer in Amplify Data (API)
            const response = await client.models.Customer.create({
                firstName: form.firstName,
                lastName: form.lastName,
                phone: form.phone,
                email: form.email || undefined,
                address: form.address || undefined,
                city: form.city || undefined,
                state: form.state || undefined,
                zipCode: form.zipCode || undefined,
                businessId: userId, // Associate with business
                cognitoId: authUser?.userId || undefined, // Associate with Cognito user if needed
            });

            if (!response.data) {
                throw new Error('Failed to create customer');
            }
            console.log('Customer created via API:', response.data);

            // Create customer in local Realm DB
            const localCustomer = {
                _id: response.data.id,
                firstName: form.firstName,
                lastName: form.lastName,
                phone: form.phone,
                email: form.email || '',
                address: form.address || '',
                city: form.city || '',
                state: form.state || '',
                zipCode: form.zipCode || '',
                businessId: userId || '',
                cognitoId: authUser?.userId || '',
            };
            try {
                await addCustomer(localCustomer);
                console.log('Customer created locally:', localCustomer);
            } catch (localErr) {
                // Optionally log or handle local DB error, but don't block API success
                console.error('Local DB customer add error:', localErr);
            }

            handleReset();
            if (onSuccess) {
                onSuccess();
            }
            Alert.alert('Success', 'Customer created successfully!');
        } catch (err: any) {
            setError(err.message || 'Failed to create customer');
        } finally {
            setLoading(false);
        }
    };

    return (
        <FormModal visible={visible} onClose={onClose} title="Add New Customer">
            <View style={styles.form}>
                <Text style={styles.label}>First Name*</Text>
                <TextInput
                    placeholder="First Name"
                    style={styles.input}
                    value={form.firstName}
                    onChangeText={v => handleChange('firstName', v)}
                />

                <Text style={styles.label}>Last Name*</Text>
                <TextInput
                    placeholder="Last Name"
                    style={styles.input}
                    value={form.lastName}
                    onChangeText={v => handleChange('lastName', v)}
                />

                <Text style={styles.label}>Phone*</Text>
                <PhoneInput
                    placeholder="Phone"
                    style={styles.input}
                    value={form.phone}
                    onChangeText={v => handleChange('phone', v)}
                    checkFn={async val => {
                        try {
                            const cleanedInput = (val || '').replace(/\D/g, '');
                            
                            if (cleanedInput.length < 10) return false; // Not enough digits, not taken
                            const { getAllCustomers } = await import('../../../localdb/services/customerService');
                            const all = await getAllCustomers();
                            
                            const arr = Array.from(all)
                                .map((c: any) => (c.phone ? c.phone.replace(/\D/g, '') : ''))
                                .filter((p: string) => p.length > 0);
                            
                            // If any phone matches, it's taken
                            return arr.includes(cleanedInput);
                        } catch (err) {
                            console.error('Phone check error:', err);
                            return false; // fallback: not taken
                        }
                    }}
                />

                <Text style={styles.label}>Email</Text>
                <TextInput
                    placeholder="Email"
                    style={styles.input}
                    value={form.email}
                    onChangeText={v => handleChange('email', v)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                />

                <Text style={styles.label}>Address</Text>
                <TextInput
                    placeholder="Address"
                    style={styles.input}
                    value={form.address}
                    onChangeText={v => handleChange('address', v)}
                />

                <View style={styles.row}>
                    <View style={styles.cityContainer}>
                        <Text style={styles.label}>City</Text>
                        <TextInput
                            placeholder="City"
                            style={styles.input}
                            value={form.city}
                            onChangeText={v => handleChange('city', v)}
                        />
                    </View>

                    <View style={styles.stateContainer}>
                        <Text style={styles.label}>State</Text>
                        <TextInput
                            placeholder="State"
                            style={styles.input}
                            value={form.state}
                            onChangeText={v => handleChange('state', v)}
                            maxLength={2}
                            autoCapitalize="characters"
                        />
                    </View>

                    <View style={styles.zipContainer}>
                        <Text style={styles.label}>Zip Code</Text>
                        <TextInput
                            placeholder="Zip Code"
                            style={styles.input}
                            value={form.zipCode}
                            onChangeText={v => handleChange('zipCode', v)}
                            keyboardType="number-pad"
                            maxLength={5}
                        />
                    </View>
                </View>

                <Text style={styles.requiredFields}>* Required fields</Text>

                <CrudButtons
                    onCreate={handleCreate}
                    onReset={handleReset}
                    onCancel={onClose}
                    isSubmitting={loading}
                    error={error}
                    showCreate
                    showReset
                    showCancel
                    disabled={!form.firstName || !form.lastName || !form.phone || !phoneAvailability.available}
                />
            </View>
        </FormModal>
    );
};

const styles = StyleSheet.create({
    form: { width: '100%' },
    label: { fontWeight: '600', marginBottom: 4, textTransform: 'capitalize' },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 10,
        marginBottom: 10,
        backgroundColor: '#fff',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    cityContainer: {
        flex: 3,
        marginRight: 8,
    },
    stateContainer: {
        flex: 1,
        marginHorizontal: 4,
    },
    zipContainer: {
        flex: 2,
        marginLeft: 8,
    },
    requiredFields: {
        color: '#666',
        fontSize: 12,
        marginBottom: 12,
        textAlign: 'right',
    },
});

export default CustomerForm;