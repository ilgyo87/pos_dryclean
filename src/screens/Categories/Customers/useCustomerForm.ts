import { useState, useRef, useEffect } from 'react';
import { Alert } from 'react-native';
import { useAvailability } from '../../../hooks/useAvailability';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../../amplify/data/resource';
import { useAuthenticator } from '@aws-amplify/ui-react-native';
import { addCustomer, getAllCustomers, updateCustomer, deleteCustomer } from '../../../localdb/services/customerService';
import type { Customer } from '../../../types';

const client = generateClient<Schema>();

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

export function useCustomerForm({ visible, customer, userId, onClose, onSuccess }: {
    visible: boolean,
    customer?: Customer | null,
    userId?: string,
    onClose: () => void,
    onSuccess?: (customer?: Customer) => void,
}) {
    const [form, setForm] = useState(initialState);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Show error alert if error is set
    useEffect(() => {
        if (error) Alert.alert('Error', error);
    }, [error]);

    const { user: authUser } = useAuthenticator((context) => [context.user]);
    const lastCustomerIdRef = useRef<string | null>(null);
    const originalPhoneRef = useRef<string>('');
    const originalEmailRef = useRef<string>('');

    // Reset form when customer changes or modal visibility changes
    useEffect(() => {
        if (visible) {
            const currentId = customer ? customer._id : null;
            if (lastCustomerIdRef.current !== currentId) {
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
                    });
                    // Store original phone and email for comparison
                    originalPhoneRef.current = (customer.phone || '').replace(/\D/g, '');
                    originalEmailRef.current = customer.email || '';
                } else {
                    setForm(initialState);
                    originalPhoneRef.current = '';
                    originalEmailRef.current = '';
                }
                setError(null);
                lastCustomerIdRef.current = currentId;
            }
        } else {
            setForm(initialState);
            setError(null);
            lastCustomerIdRef.current = null;
            originalPhoneRef.current = '';
            originalEmailRef.current = '';
        }
    }, [customer, visible]);

    // Normalize phone number and check if valid
    const normalizedCurrentPhone = form.phone.replace(/\D/g, '');
    const isPhoneValid = normalizedCurrentPhone.length >= 10;

    // Phone availability check
    const phoneAvailability = useAvailability(
        isPhoneValid ? normalizedCurrentPhone : '',
        async (val: string) => {
            try {
                const cleanedInput = val.replace(/\D/g, '');
                if (cleanedInput.length < 10) return false;
                
                // If we're editing a customer and the phone hasn't changed, it's available
                if (customer && cleanedInput === originalPhoneRef.current) {
                    return false; // Phone is available (not in use by another customer)
                }
                
                // Check if phone exists in local database
                const allCustomers = await getAllCustomers();
                const phoneExists = Array.from(allCustomers)
                    .filter((c: any) => !customer || c._id !== customer._id)
                    .some((c: any) => {
                        const customerPhone = (c.phone || '').replace(/\D/g, '');
                        return customerPhone === cleanedInput;
                    });
                    
                return phoneExists; // If true, phone is unavailable
            } catch (err) {
                console.error('Phone check error:', err);
                return false; // Assume available on error
            }
        }
    );

    // Email availability check 
    const emailAvailability = useAvailability(
        form.email && isValidEmail(form.email) ? form.email : '',
        async (val: string) => {
            try {
                if (!val) return false;
                
                // If we're editing a customer and the email hasn't changed, it's available
                if (customer && val === originalEmailRef.current) {
                    return false; // Email is available (not in use by another customer)
                }
                
                // Check if email exists in local database
                const allCustomers = await getAllCustomers();
                const emailExists = Array.from(allCustomers)
                    .filter((c: any) => !customer || c._id !== customer._id)
                    .some((c: any) => (c.email || '').toLowerCase() === val.toLowerCase());
                    
                return emailExists; // If true, email is unavailable
            } catch (err) {
                console.error('Email check error:', err);
                return false; // Assume available on error
            }
        }
    );

    // Validate email format
    function isValidEmail(email: string) {
        return email ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) : true;
    }

    // Create check functions to pass to components
    const phoneCheckFn = async (val: string) => {
        const cleanedInput = val.replace(/\D/g, '');
        if (cleanedInput.length < 10) return false;
        
        // If editing and phone hasn't changed
        if (customer && cleanedInput === originalPhoneRef.current) {
            return false;
        }
        
        const allCustomers = await getAllCustomers();
        const phoneExists = Array.from(allCustomers)
            .filter((c: any) => !customer || c._id !== customer._id)
            .some((c: any) => {
                const customerPhone = (c.phone || '').replace(/\D/g, '');
                return customerPhone === cleanedInput;
            });
            
        return phoneExists;
    };

    const emailCheckFn = async (val: string) => {
        if (!val) return false;
        
        // If editing and email hasn't changed
        if (customer && val === originalEmailRef.current) {
            return false;
        }
        
        const allCustomers = await getAllCustomers();
        const emailExists = Array.from(allCustomers)
            .filter((c: any) => !customer || c._id !== customer._id)
            .some((c: any) => (c.email || '').toLowerCase() === val.toLowerCase());
            
        return emailExists;
    };

    const handleChange = (field: keyof typeof initialState, value: string) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const handleReset = () => {
        setForm(customer ? {
            firstName: customer.firstName || '',
            lastName: customer.lastName || '',
            phone: customer.phone || '',
            email: customer.email || '',
            address: customer.address || '',
            city: customer.city || '',
            state: customer.state || '',
            zipCode: customer.zipCode || '',
        } : initialState);
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
                            // Hard delete from Realm/local
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

    const handleSubmit = async () => {
        if (!form.firstName || !form.lastName || !form.phone) {
            setError('First name, last name, and phone are required');
            return;
        }
        
        if (normalizedCurrentPhone.length < 10) {
            setError('Phone number must have at least 10 digits');
            return;
        }
        
        if (!phoneAvailability.available) {
            setError('Phone number is already in use');
            return;
        }
        
        if (form.email && !isValidEmail(form.email)) {
            setError('Please enter a valid email address');
            return;
        }
        
        if (form.email && !emailAvailability.available) {
            setError('Email address is already in use');
            return;
        }
        
        try {
            setLoading(true);
            setError(null);
            
            if (customer) {
                // Update existing customer
                await updateCustomer(customer._id, {
                    firstName: form.firstName,
                    lastName: form.lastName,
                    phone: form.phone,
                    email: form.email || '',
                    address: form.address || '',
                    city: form.city || '',
                    state: form.state || '',
                    zipCode: form.zipCode || '',
                });
                if (onSuccess) onSuccess();
                onClose();
            } else {
                // Create new customer
                const response = await client.models.Customer.create({
                    firstName: form.firstName,
                    lastName: form.lastName,
                    phone: form.phone,
                    email: form.email || undefined,
                    address: form.address || undefined,
                    city: form.city || undefined,
                    state: form.state || undefined,
                    zipCode: form.zipCode || undefined,
                    businessId: userId,
                    cognitoId: authUser?.userId || undefined,
                });
                
                if (!response.data) throw new Error('Failed to create customer');
                
                const newCustomer: Customer = {
                    _id: response.data.id,
                    firstName: form.firstName,
                    lastName: form.lastName,
                    phone: form.phone,
                    email: form.email || '',
                    address: form.address || '',
                    city: form.city || '',
                    state: form.state || '',
                    zipCode: form.zipCode || '',
                    businessId: userId,
                    cognitoId: authUser?.userId || undefined,
                };
                
                await addCustomer(newCustomer);
                if (onSuccess) onSuccess(newCustomer);
                onClose();
            }
        } catch (err: any) {
            setError(err.message || 'Error saving customer');
        } finally {
            setLoading(false);
        }
    };

    return {
        form,
        setForm,
        loading,
        error,
        phoneAvailability,
        emailAvailability,
        isPhoneValid,
        handleChange,
        handleReset,
        handleDelete,
        handleSubmit,
        isValidEmail,
        phoneCheckFn,
        emailCheckFn,
    };
}