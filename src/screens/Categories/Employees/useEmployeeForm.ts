import { useState, useRef, useEffect } from 'react';
import { Alert } from 'react-native';
import { useAvailability } from '../../../hooks/useAvailability';
import { addEmployee, getAllEmployees, updateEmployee, deleteEmployee, isPincodeTaken } from '../../../localdb/services/employeeService';
import type { Employee } from '../../../types';

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

export function useEmployeeForm({ visible, employee, onClose, onSuccess }: {
  visible: boolean,
  employee?: Employee | null,
  onClose: () => void,
  onSuccess?: (employee?: Employee) => void,
}) {
  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lastEmployeeIdRef = useRef<string | null>(null);
  const originalPhoneRef = useRef<string>('');
  const originalPinRef = useRef<string>('');

  // Reset form when employee changes or modal visibility changes
  useEffect(() => {
    if (visible) {
      const currentId = employee ? employee._id : null;
      if (lastEmployeeIdRef.current !== currentId) {
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
          originalPhoneRef.current = (employee.phone || '').replace(/\D/g, '');
          originalPinRef.current = employee.pin || '';
        } else {
          setForm(initialState);
          originalPhoneRef.current = '';
          originalPinRef.current = '';
        }
        setError(null);
        lastEmployeeIdRef.current = currentId;
      }
    } else {
      setForm(initialState);
      setError(null);
      lastEmployeeIdRef.current = null;
      originalPhoneRef.current = '';
      originalPinRef.current = '';
    }
  }, [employee, visible]);

  useEffect(() => {
    if (error) Alert.alert('Error', error);
  }, [error]);

  const normalizedCurrentPhone = form.phone.replace(/\D/g, '');
  const isPhoneValid = normalizedCurrentPhone.length >= 10;
  const isPinValid = /^\d{4}$/.test(form.pin);

  // Phone availability check
  const phoneAvailability = useAvailability(
    isPhoneValid ? normalizedCurrentPhone : '',
    async (val: string) => {
      const cleanedInput = val.replace(/\D/g, '');
      if (cleanedInput.length < 10) return false;
      if (employee && cleanedInput === originalPhoneRef.current) {
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
    }
  );

  // Pin availability check
  const pinAvailability = useAvailability(
    isPinValid ? form.pin : '',
    async (val: string) => {
      if (!val || val === originalPinRef.current) return false;
      return await isPincodeTaken(val);
    }
  );

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
    if (!isPinValid) {
      setError('Pin must be 4 digits');
      return;
    }
    if (!pinAvailability.available) {
      setError('Pincode is already taken');
      return;
    }
    try {
      setLoading(true);
      setError(null);
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

  return {
    form,
    setForm,
    loading,
    error,
    phoneAvailability,
    pinAvailability,
    isPhoneValid,
    isPinValid,
    handleChange,
    handleReset,
    handleDelete,
    handleSubmit,
  };
}
