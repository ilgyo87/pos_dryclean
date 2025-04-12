// src/screens/Employees/hooks/useEmployeeData.ts
import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { AuthUser } from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/data';
import { Schema } from '../../../../amplify/data/resource';

const client = generateClient<Schema>();

export const useEmployeesData = (user: AuthUser | null) => {
  const [employees, setEmployees] = useState<Schema['Employee']['type'][]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchEmployees = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, errors } = await client.models.Employee.list({
        filter: { userId: { eq: user.userId } }
      });

      if (errors) {
        console.error("Error fetching employees:", errors);
        Alert.alert("Error", "Failed to fetch employees data.");
        setEmployees([]);
      } else if (data) {
        setEmployees(data);
      }
    } catch (error) {
      console.error("Error in fetchEmployees:", error);
      Alert.alert("Error", "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const createEmployee = async (employeeData: Schema["Employee"]["type"]) => {
    try {
      const { data, errors } = await client.models.Employee.create({
        ...employeeData,
        userId: user?.userId || '',
        hireDate: new Date().toISOString(),
      });
    
      if (errors) {
        console.error("Error creating employee:", errors[0].message);
        throw new Error(errors[0].message); 
      }
    
      return data;
    } catch (error) {
      console.error("Error in createEmployee:", error);
      throw error;
    }
  };

  const updateEmployee = async (employeeData: Schema["Employee"]["type"]) => {
    try {
      // Prepare the update data with required fields
      const updateData: any = {
        id: employeeData.id,
        firstName: employeeData.firstName,
        lastName: employeeData.lastName,
        phoneNumber: employeeData.phoneNumber,
        role: employeeData.role,
        userId: user?.userId || ''
      };

      // Add optional fields if they exist
      if (employeeData.email) updateData.email = employeeData.email;
      if (employeeData.hourlyRate) updateData.hourlyRate = employeeData.hourlyRate;
      if (employeeData.status) updateData.status = employeeData.status;
      if (employeeData.address) updateData.address = employeeData.address;
      if (employeeData.city) updateData.city = employeeData.city;
      if (employeeData.state) updateData.state = employeeData.state;
      if (employeeData.zipCode) updateData.zipCode = employeeData.zipCode;

      const { data, errors } = await client.models.Employee.update(updateData);

      if (errors) {
        console.error("Error updating employee:", errors);
        throw new Error(errors[0].message);
      }

      return data;
    } catch (error) {
      console.error("Error in updateEmployee:", error);
      throw error;
    }
  };

  const deleteEmployee = async (employee: Schema["Employee"]["type"]) => {
    const { errors } = await client.models.Employee.delete({
      id: employee.id,
    });

    if (errors) {
      console.error("Error deleting employee:", errors);
      throw new Error('Failed to delete employee');
    }
  };

  useEffect(() => {
    if (user) {
      fetchEmployees();
    }
  }, [user?.userId]);

  return {
    employees,
    isLoading,
    refreshing,
    setRefreshing,
    fetchEmployees,
    createEmployee,
    updateEmployee,
    deleteEmployee
  };
};