// src/screens/Customers/hooks/useCustomersData.ts
import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { AuthUser } from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/data';
import { Schema } from '../../../../amplify/data/resource';

const client = generateClient<Schema>();

export const useCustomersData = (user: AuthUser | null) => {
  const [customers, setCustomers] = useState<Schema['Customer']['type'][]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchCustomers = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, errors } = await client.models.Customer.list({
        filter: { userId: { eq: user.userId } }
      });
      
      if (errors) {
        console.error("Error fetching customers:", errors);
        Alert.alert("Error", "Failed to fetch customers data.");
        setCustomers([]);
      } else if (data) {
        setCustomers(data);
      }
    } catch (error) {
      console.error("Error in fetchCustomers:", error);
      Alert.alert("Error", "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const createCustomer = async (customerData: Schema["Customer"]["type"]) => {
    const { data, errors } = await client.models.Customer.create({
      ...customerData,
      userId: user?.userId || '',
    });
    
    if (errors) {
      console.error("Error creating customer:", errors);
      throw new Error('Failed to create customer');
    }
    
    return data;
  };

  const updateCustomer = async (customerData: Schema["Customer"]["type"]) => {
    const { data, errors } = await client.models.Customer.update({
      id: customerData.id,
      firstName: customerData.firstName,
      lastName: customerData.lastName,
      email: customerData.email,
      phoneNumber: customerData.phoneNumber,
      address: customerData.address,
      notes: customerData.notes,
      userId: user?.userId || '',
    });
    
    if (errors) {
      console.error("Error updating customer:", errors);
      throw new Error('Failed to update customer');
    }
    
    return data;
  };

  const deleteCustomer = async (customer: Schema["Customer"]["type"]) => {
    const { errors } = await client.models.Customer.delete({
      id: customer.id,
    });
    
    if (errors) {
      console.error("Error deleting customer:", errors);
      throw new Error('Failed to delete customer');
    }
  };

  const getBusinessId = async () => {
    // Get the first business for this user
    const { data } = await client.models.Business.list({
      filter: { userId: { eq: user?.userId } }
    });
    
    if (data && data.length > 0) {
      return data[0].id;
    }
    
    throw new Error('No business found for this user');
  };

  useEffect(() => {
    if (user) {
      fetchCustomers();
    }
  }, [user?.userId]);

  return {
    customers,
    isLoading,
    refreshing,
    setRefreshing,
    fetchCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer
  };
};