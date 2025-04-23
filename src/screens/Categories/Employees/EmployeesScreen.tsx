import React, { useState, useEffect } from 'react';
import { View, StyleSheet, SafeAreaView, Text } from 'react-native';
import EmployeeList from './EmployeeList';
import AddEmployeeButton from './AddEmployeeButton';
import EmployeeForm from './EmployeeForm';
import { Employee } from '../../../types';
import { getAllEmployees } from '../../../localdb/services/employeeService';

interface EmployeesScreenProps {
  employeeId?: string;
  firstName?: string;
  lastName?: string;
}

const EmployeesScreen: React.FC<EmployeesScreenProps> = ({ employeeId, firstName, lastName }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  const fetchEmployees = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const all = await getAllEmployees();
      // Convert Realm Results to plain Employee[]
      const employeesArray = Array.from(all).map((emp: any) =>
        typeof emp.toJSON === 'function' ? emp.toJSON() : { ...emp }
      );
      setEmployees(employeesArray);
    } catch (err: any) {
      setError(err.message || 'Failed to load employees');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <EmployeeList
        employees={employees}
        isLoading={isLoading}
        error={error}
        onRefresh={fetchEmployees}
        onEmployeeSelect={setEditingEmployee}
      />
      <AddEmployeeButton onSuccess={fetchEmployees} />
      <EmployeeForm
        visible={!!editingEmployee}
        onClose={() => setEditingEmployee(null)}
        onSuccess={fetchEmployees}
        employee={editingEmployee}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
});

export default EmployeesScreen;
