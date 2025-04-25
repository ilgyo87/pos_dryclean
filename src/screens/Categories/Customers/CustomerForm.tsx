import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import FormModal from './../../../components/FormModal';
import CrudButtons from './../../../components/CrudButtons';
import type { Customer } from '../../../types';
import { CustomerNameFields } from './CustomerNameFields';
import { CustomerContactFields } from './CustomerContactFields';
import { CustomerAddressFields } from './CustomerAddressFields';
import { DatePickerField } from '../../../components/DatePickerField';
import { addCustomer, getAllCustomers, updateCustomer, deleteCustomer } from '../../../localdb/services/customerService';

interface CustomerFormProps {
    visible: boolean;
    userId?: string;
    onClose: () => void;
    onSuccess?: (customer?: Customer) => void;
    customer?: Customer | null; // For edit mode
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
    dob: undefined as Date | undefined,
};

const CustomerForm: React.FC<CustomerFormProps> = ({
    visible,
    userId,
    onClose,
    onSuccess,
    customer = null
}) => {
    const [form, setForm] = useState(initialState);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);

    // Store original values for comparison when editing
    const [originalPhone, setOriginalPhone] = useState('');
    const [originalEmail, setOriginalEmail] = useState('');

    // Reset form when customer changes or modal visibility changes
    useEffect(() => {
        if (visible) {
            if (customer) {
                setForm({
                    firstName: customer.firstName || '',
                    lastName: customer.lastName || '',
                    phone: customer.phone || '',
                    email: customer.email || '',
                    address: customer.address || '',
                    city: customer.city || '',
                    state: customer.state || '',
                    zipCode: customer.zipCode || '',
                    dob: customer.dob ? new Date(customer.dob) : undefined,
                });
                setOriginalPhone((customer.phone || '').replace(/\D/g, ''));
                setOriginalEmail(customer.email || '');
            } else {
                setForm(initialState);
                setOriginalPhone('');
                setOriginalEmail('');
            }
            setError(null);
            setIsInitialized(true);
        }
    }, [customer, visible]);

    // Show error alert if error is set
    useEffect(() => {
        if (error) Alert.alert('Error', error);
    }, [error]);

    // Track phone error from child
    const [phoneError, setPhoneError] = useState<string | null>(null);

    const handleChange = (field: keyof typeof initialState, value: string) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const handleReset = () => {
        if (customer) {
            setForm({
                firstName: customer.firstName || '',
                lastName: customer.lastName || '',
                phone: customer.phone || '',
                email: customer.email || '',
                address: customer.address || '',
                city: customer.city || '',
                state: customer.state || '',
                zipCode: customer.zipCode || '',
                dob: customer.dob ? new Date(customer.dob) : undefined,
            });
        } else {
            setForm(initialState);
        }
        setError(null);
    };

    const handleDelete = async () => {
        Alert.alert(
            'Delete Customer',
            'Are you sure you want to delete this customer?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setLoading(true);
                            setError(null);
                            if (!customer) throw new Error('No customer to delete');
                            
                            // Delete from local database
                            await deleteCustomer(customer._id);
                            
                            if (onSuccess) onSuccess();
                            onClose();
                        } catch (err: any) {
                            setError(err.message || 'Failed to delete customer');
                        } finally {
                            setLoading(false);
                        }
                    },
                },
            ]
        );
    };

    // Phone number check function
    const phoneCheckFn = async (val: string) => {
        const cleanedInput = val.replace(/\D/g, '');
        if (cleanedInput.length < 10) return false;

        // If editing and phone hasn't changed
        if (customer && cleanedInput === originalPhone) {
            return false; // Not in use by another customer
        }

        const allCustomers = await getAllCustomers();
        const phoneExists = Array.from(allCustomers)
            .filter((c: any) => !customer || c._id !== customer._id)
            .some((c: any) => {
                const customerPhone = (c.phone || '').replace(/\D/g, '');
                return customerPhone === cleanedInput;
            });

        return phoneExists; // If true, phone is in use
    };

    // Email check function
    const emailCheckFn = async (val: string) => {
        if (!val) return false;

        // If editing and email hasn't changed
        if (customer && val === originalEmail) {
            return false; // Not in use by another customer
        }

        const allCustomers = await getAllCustomers();
        const emailExists = Array.from(allCustomers)
            .filter((c: any) => !customer || c._id !== customer._id)
            .some((c: any) => (c.email || '').toLowerCase() === val.toLowerCase());

        return emailExists; // If true, email is in use
    };

    const handleCreate = async () => {
        // Basic validation
        if (!form.firstName || !form.lastName || !form.phone) {
            setError('First name, last name, and phone are required');
            return;
        }

        const normalizedPhone = form.phone.replace(/\D/g, '');
        if (normalizedPhone.length < 10) {
            setError('Phone number must have at least 10 digits');
            return;
        }

        // Check phone availability
        const phoneInUse = await phoneCheckFn(normalizedPhone);
        if (phoneInUse) {
            setError('Phone number is already in use');
            return;
        }

        // Check email if provided
        if (form.email) {
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
                setError('Please enter a valid email address');
                return;
            }

            const emailInUse = await emailCheckFn(form.email);
            if (emailInUse) {
                setError('Email address is already in use');
                return;
            }
        }

        try {
            setLoading(true);
            setError(null);

            // Create new customer
            const newCustomer: Customer = {
                _id: Date.now().toString(),
                firstName: form.firstName,
                lastName: form.lastName,
                phone: form.phone,
                email: form.email || '',
                address: form.address || '',
                city: form.city || '',
                state: form.state || '',
                zipCode: form.zipCode || '',
                dob: form.dob,
                businessId: userId,
                notes: [],
                createdAt: new Date(),
                updatedAt: new Date(),
                imageName: '',
                location: undefined,
            };
            
            // Add to local database
            console.log("Creating new customer:", newCustomer._id);
            await addCustomer(newCustomer);
            
            if (onSuccess) onSuccess(newCustomer);
            
            // Reset form and close modal
            setForm(initialState);
            onClose();
        } catch (err: any) {
            console.error("Error creating customer:", err);
            setError(err.message || 'Error creating customer');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async () => {
        if (!customer) {
            setError('No customer to update');
            return;
        }

        // Basic validation
        if (!form.firstName || !form.lastName || !form.phone) {
            setError('First name, last name, and phone are required');
            return;
        }

        const normalizedPhone = form.phone.replace(/\D/g, '');
        if (normalizedPhone.length < 10) {
            setError('Phone number must have at least 10 digits');
            return;
        }

        // Skip phone check if unchanged during edit
        if (normalizedPhone !== originalPhone) {
            const phoneInUse = await phoneCheckFn(normalizedPhone);
            if (phoneInUse) {
                setError('Phone number is already in use');
                return;
            }
        }

        // Check email if provided
        if (form.email && form.email !== originalEmail) {
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
                setError('Please enter a valid email address');
                return;
            }

            const emailInUse = await emailCheckFn(form.email);
            if (emailInUse) {
                setError('Email address is already in use');
                return;
            }
        }

        try {
            setLoading(true);
            setError(null);

            // Create update object
            const now = new Date();
            const updates = {
                firstName: form.firstName,
                lastName: form.lastName,
                phone: form.phone,
                email: form.email || '',
                address: form.address || '',
                city: form.city || '',
                state: form.state || '',
                zipCode: form.zipCode || '',
                dob: form.dob,
                updatedAt: now
            };
            
            console.log("Updating customer:", customer._id);
            
            // Update in local database
            await updateCustomer(customer._id, updates);
            
            // Create updated customer object for callback
            const updatedCustomer = {
                ...customer,
                ...updates
            };
            
            // Success callback and close
            if (onSuccess) onSuccess(updatedCustomer);
            
            // Reset form and close modal
            setForm(initialState);
            onClose();
        } catch (err: any) {
            console.error("Error updating customer:", err);
            setError(err.message || 'Error updating customer');
        } finally {
            setLoading(false);
        }
    };

    // Only render once initialized to prevent flicker
    if (!isInitialized && visible) {
        return null;
    }

    return (
        <FormModal visible={visible} onClose={onClose} title={customer ? "Edit Customer" : "Add New Customer"}>
            <View style={styles.form}>
                <CustomerNameFields
                    firstName={form.firstName}
                    lastName={form.lastName}
                    onChange={handleChange}
                />
                <CustomerContactFields
                    phone={form.phone}
                    email={form.email}
                    onChange={handleChange}
                    phoneCheckFn={phoneCheckFn}
                    emailCheckFn={emailCheckFn}
                    onPhoneError={setPhoneError}
                />
                <CustomerAddressFields
                    address={form.address}
                    city={form.city}
                    state={form.state}
                    zipCode={form.zipCode}
                    onChange={handleChange}
                />
                <Text style={styles.requiredFields}>* Required fields</Text>
                <CrudButtons
                    onCreate={!customer ? handleCreate : undefined}
                    onUpdate={customer ? handleUpdate : undefined}
                    onDelete={customer ? handleDelete : undefined}
                    onReset={handleReset}
                    onCancel={onClose}
                    isSubmitting={loading}
                    showCreate={!customer}
                    showUpdate={!!customer}
                    showDelete={!!customer}
                    showReset
                    showCancel
                    disabled={!form.firstName || !form.lastName || !form.phone || phoneError !== null}
                />
            </View>
        </FormModal>
    );
}

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