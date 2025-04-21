import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import FormModal from './../../../components/FormModal';
import CrudButtons from './../../../components/CrudButtons';
import type { Customer } from '../../../types';
import { useCustomerForm } from './useCustomerForm';
import { CustomerNameFields } from './CustomerNameFields';
import { CustomerContactFields } from './CustomerContactFields';
import { CustomerAddressFields } from './CustomerAddressFields';

interface CustomerFormProps {
    visible: boolean;
    userId?: string;
    onClose: () => void;
    onSuccess?: (customer?: Customer) => void;
    customer?: Customer | null; // New: for edit mode
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
    onSuccess,
    customer = null
}) => {
    const {
        form,
        loading,
        phoneAvailability,
        isPhoneValid,
        emailAvailable,
        handleChange,
        handleReset,
        handleDelete,
        handleSubmit,
        isValidEmail,
    } = useCustomerForm({ visible, customer, userId, onClose, onSuccess });

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
                    phoneCheckFn={async () => true} // Placeholder, availability handled by useAvailability
                    
                    emailCheckFn={async () => true} // Placeholder, add real check if needed
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
                    // Only disable the create/update button, never cancel/reset
                    disabled={
                        !form.firstName ||
                        !form.lastName ||
                        !form.phone ||
                        !isPhoneValid ||
                        !phoneAvailability.available ||
                        (form.email ? !isValidEmail(form.email) || !emailAvailable : false)
                    }
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