import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView } from 'react-native';
import FormModal from '../../../components/FormModal';
import CrudButtons from '../../../components/CrudButtons';
import type { Employee } from '../../../types';
import { useAvailability } from '../../../hooks/useAvailability';
import { addEmployee, getAllEmployees, updateEmployee, deleteEmployee, isPincodeTaken } from '../../../localdb/services/employeeService';


interface EmployeeFormProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: (employee?: Employee) => void;
  employee?: Employee | null;
}

const initialState = {
  firstName: '',
  lastName: '',
  phone: '',
  pin: '',
  email: '',
  address: '',
  city: '',
  state: '',
  zipCode: '',
};

import { EmployeeAddressFields } from './EmployeeAddressFields';
import { EmployeePinField } from './EmployeePinField';

const EmployeeForm: React.FC<EmployeeFormProps> = ({ visible, onClose, onSuccess, employee = null }) => {
  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [originalPin, setOriginalPin] = useState('');
  const [pinAvailable, setPinAvailable] = useState(true);
  const [pinLoading, setPinLoading] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      if (employee) {
        setForm({
          firstName: employee.firstName || '',
          lastName: employee.lastName || '',
          phone: employee.phone || '',
          pin: employee.pin || '',
          email: employee.email || '',
          address: employee.address || '',
          city: employee.city || '',
          state: employee.state || '',
          zipCode: employee.zipCode || '',
        });
        setOriginalPin(employee.pin || '');
      } else {
        setForm(initialState);
        setOriginalPin('');
      }
      setError(null);
    }
  }, [employee, visible]);

  useEffect(() => {
    if (error) Alert.alert('Error', error);
  }, [error]);

  const handleChange = (field: keyof typeof initialState, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleReset = () => {
    if (employee) {
      setForm({
        firstName: employee.firstName || '',
        lastName: employee.lastName || '',
        phone: employee.phone || '',
        pin: employee.pin || '',
        email: employee.email || '',
        address: employee.address || '',
        city: employee.city || '',
        state: employee.state || '',
        zipCode: employee.zipCode || '',
      });
    } else {
      setForm(initialState);
    }
    setError(null);
  };

  const handleDelete = async () => {
    Alert.alert(
      'Delete Employee',
      'Are you sure you want to delete this employee?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              if (employee && employee._id) {
                await deleteEmployee(employee._id);
                onSuccess && onSuccess();
                onClose();
              }
            } catch (e: any) {
              setError(e.message || 'Failed to delete employee');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  // Phone number check function for Employee
  const phoneCheckFn = async (val: string) => {
    const cleanedInput = val.replace(/\D/g, '');
    if (cleanedInput.length < 10) return false;
    if (employee && cleanedInput === (employee.phone || '').replace(/\D/g, '')) {
      return false;
    }
    const allEmployees = await getAllEmployees();
    const phoneExists = Array.from(allEmployees)
      .filter((e: any) => !employee || e._id !== employee._id)
      .some((e: any) => {
        const empPhone = (e.phone || '').replace(/\D/g, '');
        return empPhone === cleanedInput;
      });
    return phoneExists;
  };

  // Pin check logic
  useEffect(() => {
    let active = true;
    const check = async () => {
      const val = form.pin;
      if (val.length !== 4) {
        if (active) {
          setPinAvailable(true);
          setPinLoading(false);
          setPinError(null);
        }
        return;
      }
      // If editing and pin unchanged, it's available
      if (employee && val === originalPin) {
        if (active) {
          setPinAvailable(true);
          setPinLoading(false);
          setPinError(null);
        }
        return;
      }
      setPinLoading(true);
      setPinError(null);
      try {
        // Check against all employees (case-insensitive)
        const allEmployees = await getAllEmployees();
        const pinTaken = Array.from(allEmployees)
          .filter((e: any) => !employee || e._id !== employee._id)
          .some((e: any) => (e.pin || '').toLowerCase() === val.toLowerCase());
        if (active) setPinAvailable(!pinTaken);
      } catch (err: any) {
        if (active) {
          setPinAvailable(false);
          setPinError(err.message || 'Error checking pin');
        }
      } finally {
        if (active) setPinLoading(false);
      }
    };
    check();
    return () => { active = false; };
  }, [form.pin, originalPin, employee]);

  const isPinValid = /^\d{4}$/.test(form.pin);
  const isPhoneValid = form.phone.replace(/\D/g, '').length >= 10;

  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (employee) {
        await updateEmployee(employee._id, form);
        onSuccess && onSuccess({ ...employee, ...form });
      } else {
        const newEmployee = {
          ...form,
          _id: Date.now().toString(),
        };
        await addEmployee(newEmployee as Employee);
        onSuccess && onSuccess(newEmployee as Employee);
      }
      onClose();
    } catch (e: any) {
      setError(e.message || 'Failed to save employee');
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormModal visible={visible} onClose={onClose} title={employee ? 'Edit Employee' : 'Add New Employee'}>
      <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
        <EmployeeNameFields
          firstName={form.firstName}
          lastName={form.lastName}
          onChange={handleChange}
        />
        <EmployeeContactFields
          phone={form.phone}
          onChange={handleChange}
          phoneCheckFn={phoneCheckFn}
        />
        <EmployeePinField
          pin={form.pin}
          onChange={handleChange}
          isAvailable={pinAvailable}
          isLoading={pinLoading}
          errorMessage={pinError}
        />
        <Text style={styles.label}>Email</Text>
        <TextInput value={form.email} onChangeText={(val: string) => handleChange('email', val)} style={styles.input} keyboardType="email-address" />
        <EmployeeAddressFields
          address={form.address}
          city={form.city}
          state={form.state}
          zipCode={form.zipCode}
          onChange={handleChange}
        />
        <Text style={styles.requiredFields}>* Required fields</Text>
        <CrudButtons
          onCreate={!employee ? handleSubmit : undefined}
          onUpdate={employee ? handleSubmit : undefined}
          onDelete={employee ? handleDelete : undefined}
          onReset={handleReset}
          onCancel={onClose}
          isSubmitting={loading}
          showCreate={!employee}
          showUpdate={!!employee}
          showDelete={!!employee}
          showReset
          showCancel
          disabled={loading || !form.firstName || !form.lastName || !isPhoneValid || !isPinValid || !pinAvailable}
        />
      </ScrollView>
    </FormModal>
  );
};

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
  requiredFields: {
    color: '#666',
    fontSize: 12,
    marginBottom: 12,
    textAlign: 'right',
  },
});

// Use your existing Input component or replace with TextInput from react-native
import { EmployeeNameFields } from './EmployeeNameFields';
import { EmployeeContactFields } from './EmployeeContactFields';
import { TextInput } from 'react-native';

export default EmployeeForm;
