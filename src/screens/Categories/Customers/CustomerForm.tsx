import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, Image } from 'react-native';
import FormModal from './../../../components/FormModal';
import CrudButtons from './../../../components/CrudButtons';
import type { Customer } from '../../../types';
import { CustomerNameFields } from './CustomerNameFields';
import { CustomerContactFields } from './CustomerContactFields';
import { CustomerAddressFields } from './CustomerAddressFields';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../../amplify/data/resource';
import { useAuthenticator } from '@aws-amplify/ui-react-native';
import { addCustomer, getAllCustomers, updateCustomer, deleteCustomer } from '../../../localdb/services/customerService';
import ImagePicker from '../../../components/ImagePicker';
import { getGarmentImage } from '../../../utils/ImageMapping';

const client = generateClient<Schema>();

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
    imageName: '',
};

const CustomerForm: React.FC<CustomerFormProps> = ({
    visible,
    userId,
    onClose,
    onSuccess,
    customer = null
}) => {
    const [imagePickerVisible, setImagePickerVisible] = useState(false);
    const [form, setForm] = useState(initialState);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { user: authUser } = useAuthenticator((context) => [context.user]);
    
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
                    imageName: customer.imageName || '',
                });
                setOriginalPhone((customer.phone || '').replace(/\D/g, ''));
                setOriginalEmail(customer.email || '');
            } else {
                setForm(initialState);
                setOriginalPhone('');
                setOriginalEmail('');
            }
            setError(null);
        }
    }, [customer, visible]);

    // Show error alert if error is set
    useEffect(() => {
        if (error) Alert.alert('Error', error);
    }, [error]);
    
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
                imageName: customer.imageName || '',
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
    
    // Validate email format
    const isValidEmail = (email: string) => {
        return email ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) : true;
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
    
    const handleSubmit = async () => {
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
        
        // Check phone availability (skip if unchanged during edit)
        if (!(customer && normalizedPhone === originalPhone)) {
            const phoneInUse = await phoneCheckFn(normalizedPhone);
            if (phoneInUse) {
                setError('Phone number is already in use');
                return;
            }
        }
        
        // Check email if provided
        if (form.email) {
            if (!isValidEmail(form.email)) {
                setError('Please enter a valid email address');
                return;
            }
            
            // Check email availability (skip if unchanged during edit)
            if (!(customer && form.email === originalEmail)) {
                const emailInUse = await emailCheckFn(form.email);
                if (emailInUse) {
                    setError('Email address is already in use');
                    return;
                }
            }
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
                    imageName: form.imageName || '',
                });
                if (onSuccess) onSuccess();
                onClose();
            } else {
                // Create new customer (local DB only, no API call)
                try {
                    const newCustomer: Customer = {
                        _id: Date.now().toString(), // Generate a unique ID for local use
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
                        imageName: form.imageName || '',
                    };
                    console.log('[CUSTOMER][LOCAL] Creating customer in local DB:', JSON.stringify(newCustomer));
                    await addCustomer(newCustomer);
                    if (onSuccess) onSuccess(newCustomer);
                    onClose();
                } catch (err: any) {
                    setError(err.message || 'Error saving customer');
                }
            }
        } finally {
            setLoading(false);
        }
    };
    
    // Check if form is valid for enabling submit button
    const isFormValid = () => {
        const normalizedPhone = form.phone.replace(/\D/g, '');
        const isPhoneValid = normalizedPhone.length >= 10;
        const isEmailValid = !form.email || isValidEmail(form.email);
        
        return (
            !!form.firstName &&
            !!form.lastName &&
            isPhoneValid &&
            isEmailValid
        );
    };

    return (
        <FormModal visible={visible} onClose={onClose} title={customer ? "Edit Customer" : "Add New Customer"}>
            <View style={styles.form}>
                <CustomerNameFields
                    firstName={form.firstName}
                    lastName={form.lastName}
                    onChange={handleChange}
                />
                <View>
                    <Text style={styles.label}>Image</Text>
                    <TouchableOpacity
                      style={{
                        borderWidth: 1,
                        borderColor: '#ccc',
                        borderRadius: 8,
                        padding: 10,
                        marginBottom: 10,
                        backgroundColor: '#f5f5f5',
                        alignItems: 'center',
                      }}
                      onPress={() => setImagePickerVisible(true)}
                    >
                      <Text>{form.imageName ? 'Change Image' : 'Pick an Image'}</Text>
                    </TouchableOpacity>
                    <ImagePicker
                      value={form.imageName}
                      onChange={(imageName: string) => {
                        handleChange('imageName', imageName);
                        setImagePickerVisible(false);
                      }}
                      visible={imagePickerVisible}
                      onClose={() => setImagePickerVisible(false)}
                    />
                    {form.imageName ? (
                      <Image
                        source={getGarmentImage(form.imageName)}
                        style={{ width: 60, height: 60, alignSelf: 'center', marginBottom: 10 }}
                        resizeMode="contain"
                      />
                    ) : null}
                </View>
                <CustomerContactFields
                    phone={form.phone}
                    email={form.email}
                    onChange={handleChange}
                    phoneCheckFn={phoneCheckFn}
                    emailCheckFn={emailCheckFn}
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
                    onCreate={!customer ? handleSubmit : undefined}
                    onUpdate={customer ? handleSubmit : undefined}
                    onDelete={customer ? handleDelete : undefined}
                    onReset={handleReset}
                    onCancel={onClose}
                    isSubmitting={loading}
                    showCreate={!customer}
                    showUpdate={!!customer}
                    showDelete={!!customer}
                    showReset
                    showCancel
                    disabled={!isFormValid()}
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