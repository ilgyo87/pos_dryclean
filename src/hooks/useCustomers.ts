// src/hooks/useCustomers.ts
import { useState, useCallback, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { Customer } from '../types';

const client = generateClient<Schema>();

export function useCustomers() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchCustomers = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const { getAllCustomers } = await import('../localdb/services/customerService');
            const realmResults = await getAllCustomers();
            // Realm objects need to be mapped to plain JS objects
            const customerData: Customer[] = Array.from(realmResults).map((item: any) => ({
                _id: item._id,
                firstName: item.firstName,
                lastName: item.lastName,
                phone: item.phone || '',
                email: item.email || '',
                address: item.address || '',
                city: item.city || '',
                state: item.state || '',
                zipCode: item.zipCode || '',
                businessId: item.businessId || '',
                cognitoId: item.cognitoId || '',
            }));
            setCustomers(customerData);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch customers');
            console.error('Error fetching customers:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Initial fetch
    useEffect(() => {
        fetchCustomers();
    }, [fetchCustomers]);

    return {
        customers,
        isLoading,
        error,
        refetch: fetchCustomers,
    };
}