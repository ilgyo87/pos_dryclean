// src/components/Customers/AddCustomerButton.tsx
import React, { useState } from 'react';
import { TouchableOpacity, StyleSheet, Text } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import CustomerForm from './CustomerForm';

interface AddCustomerButtonProps {
    userId?: string;
    onSuccess?: () => void;
}

const AddCustomerButton: React.FC<AddCustomerButtonProps> = ({ userId, onSuccess }) => {
    const [showForm, setShowForm] = useState(false);

    return (
        <>
            <TouchableOpacity
                style={styles.fabButton}
                onPress={() => setShowForm(true)}
            >
                <MaterialIcons name="add" size={24} color="white" />
                <Text style={styles.fabText}>Add Customer</Text>
            </TouchableOpacity>

            <CustomerForm
                visible={showForm}
                userId={userId}
                onClose={() => setShowForm(false)}
                onSuccess={() => {
                    setShowForm(false);
                    if (onSuccess) onSuccess();
                }}
            />
        </>
    );
};

const styles = StyleSheet.create({
    fabButton: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        backgroundColor: '#007bff',
        borderRadius: 30,
        paddingVertical: 12,
        paddingHorizontal: 20,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        flexDirection: 'row',
        alignItems: 'center',
    },
    fabText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
        marginLeft: 8,
    },
});

export default AddCustomerButton;