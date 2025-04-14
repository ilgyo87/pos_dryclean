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
    // Create a copy of the data to modify
    const customerDataToSave = { ...customerData };

    // Handle email field - if it's empty or invalid, omit it from the request
    if (!customerDataToSave.email || customerDataToSave.email === '' || customerDataToSave.email === 'none@example.com') {
      delete customerDataToSave.email;
    }

    try {
      const { data, errors } = await client.models.Customer.create({
        ...customerDataToSave,
        userId: user?.userId || '',
      });

      if (errors) {
        console.error("Error creating customer:", errors[0].message);
        throw new Error(errors[0].message);
      }

      return data;
    } catch (error) {
      console.error("Error in createCustomer:", error);
      throw error; // Change this to throw the error
    }
  };

  const updateCustomer = async (customerData: Schema["Customer"]["type"]) => {
    // First, check if phone number already exists (but skip if it's the same customer)
    if (customerData.phoneNumber) {
      const { data: existingCustomers } = await client.models.Customer.list({
        filter: {
          and: [
            { phoneNumber: { eq: customerData.phoneNumber.trim() } },
            { id: { ne: customerData.id } }, // Exclude the current customer
            { userId: { eq: user?.userId || '' } } // Only check within the user's records
          ]
        }
      });

      if (existingCustomers && existingCustomers.length > 0) {
        // Phone number already exists for another customer
        Alert.alert(
          "Duplicate Phone Number",
          "This phone number is already in use by another customer. Please use a different phone number."
        );
        throw new Error('Phone number already exists');
      }
    }

    // Prepare the update data with required fields
    // Use type assertion to make TypeScript happy
    const updateData: any = {
      id: customerData.id, // id is required for update
      firstName: customerData.firstName,
      lastName: customerData.lastName,
      phoneNumber: customerData.phoneNumber,
      userId: user?.userId || ''
    };

    // Add optional fields if they exist
    if (customerData.address) {
      updateData.address = customerData.address;
    }

    if (customerData.notes) {
      updateData.notes = customerData.notes;
    }

    // Handle email field - only include if it's valid
    if (customerData.email && customerData.email !== '' && customerData.email !== 'none@example.com') {
      updateData.email = customerData.email;
    }

    // If no duplicates, proceed with update
    const { data, errors } = await client.models.Customer.update(updateData);

    if (errors) {
      console.error("Error updating customer:", errors);
    }

    return data;
  };

  const deleteCustomer = async (customerId: string) => {
    if (!customerId) {
      throw new Error('Customer ID is required to delete');
    }

    const { errors } = await client.models.Customer.delete({
      id: customerId,
    });

    if (errors) {
      console.error("Error deleting customer:", errors);
      throw new Error('Failed to delete customer');
    }
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