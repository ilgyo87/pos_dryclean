// src/screens/EmployeeManagement/components/EmployeeDetailModal.tsx
import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { generateClient } from 'aws-amplify/data';
import { Schema } from '../../../../amplify/data/resource';
import { styles } from '../styles/employeeManagementStyles';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { 
  Employee, 
  EmployeeRole, 
  EmployeeStatus,
  EmployeePermissions
} from '../types/EmployeeTypes';

const client = generateClient<Schema>();

interface EmployeeDetailModalProps {
  visible: boolean;
  onClose: () => void;
  employee: Employee;
  onEmployeeUpdated: (employee: Employee) => void;
  businessId: string;
}

const EmployeeDetailModal: React.FC<EmployeeDetailModalProps> = ({
  visible,
  onClose,
  employee,
  onEmployeeUpdated,
  businessId
}) => {
  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [role, setRole] = useState<EmployeeRole>(EmployeeRole.STAFF);
  const [hourlyRate, setHourlyRate] = useState('');
  const [hireDate, setHireDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [status, setStatus] = useState<EmployeeStatus>(EmployeeStatus.ACTIVE);
  
  // Permissions state
  const [permissions, setPermissions] = useState<EmployeePermissions>({
    manageEmployees: false,
    manageCustomers: false,
    manageProducts: false,
    manageOrders: false,
    viewReports: false,
    processTransactions: false,
    manageSettings: false
  });
  
  // Form validation and submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  
  // Set initial form values when employee data changes
  useEffect(() => {
    if (employee && visible) {
      setFirstName(employee.firstName || '');
      setLastName(employee.lastName || '');
      setEmail(employee.email || '');
      
      // Format phone number if it exists
      if (employee.phoneNumber) {
        const cleaned = employee.phoneNumber.replace(/\D/g, '');
        let formatted = '';
        if (cleaned.length <= 3) {
          formatted = cleaned;
        } else if (cleaned.length <= 6) {
          formatted = `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
        } else {
          formatted = `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
        }
        setPhoneNumber(formatted);
      } else {
        setPhoneNumber('');
      }
      
      setRole(employee.role as EmployeeRole || EmployeeRole.STAFF);
      setHourlyRate(employee.hourlyRate ? employee.hourlyRate.toString() : '');
      
      if (employee.hireDate) {
        setHireDate(new Date(employee.hireDate));
      }
      
      setStatus(employee.status as EmployeeStatus || EmployeeStatus.ACTIVE);
      
      // Parse permissions JSON string if it exists
      if (employee.permissions) {
        try {
          const parsedPermissions = JSON.parse(employee.permissions);
          setPermissions({
            manageEmployees: parsedPermissions.manageEmployees || false,
            manageCustomers: parsedPermissions.manageCustomers || false,
            manageProducts: parsedPermissions.manageProducts || false,
            manageOrders: parsedPermissions.manageOrders || false,
            viewReports: parsedPermissions.viewReports || false,
            processTransactions: parsedPermissions.processTransactions || false,
            manageSettings: parsedPermissions.manageSettings || false
          });
        } catch (error) {
          console.error('Error parsing permissions:', error);
          // Reset to default permissions if parsing fails
          setPermissions({
            manageEmployees: false,
            manageCustomers: false,
            manageProducts: false,
            manageOrders: false,
            viewReports: false,
            processTransactions: false,
            manageSettings: false
          });
        }
      }
    }
  }, [employee, visible]);

  // Validate form fields on change
  useEffect(() => {
    validateForm();
  }, [firstName, lastName, email, phoneNumber, role, hourlyRate]);

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    // Validate first name
    if (!firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    
    // Validate last name
    if (!lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    
    // Validate email
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    // Validate phone number
    if (!phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!/^\(\d{3}\) \d{3}-\d{4}$/.test(phoneNumber.trim())) {
      newErrors.phoneNumber = 'Please enter a valid phone number';
    }
    
    // Validate hourly rate if provided
    if (hourlyRate && isNaN(parseFloat(hourlyRate))) {
      newErrors.hourlyRate = 'Hourly rate must be a valid number';
    }
    
    setErrors(newErrors);
    setIsFormValid(Object.keys(newErrors).length === 0);
    
    return Object.keys(newErrors).length === 0;
  };

  // Format phone number as user types (e.g., (123) 456-7890)
  const handlePhoneChange = (text: string) => {
    // Remove all non-digit characters
    const cleaned = text.replace(/\D/g, '');
    
    // Format the phone number
    let formatted = '';
    if (cleaned.length <= 3) {
      formatted = cleaned;
    } else if (cleaned.length <= 6) {
      formatted = `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    } else {
      formatted = `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
    }
    
    setPhoneNumber(formatted);
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setHireDate(selectedDate);
    }
  };

  const togglePermission = (key: keyof EmployeePermissions) => {
    setPermissions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleUpdateEmployee = async () => {
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    try {
      // Convert permissions object to JSON string
      const permissionsString = JSON.stringify(permissions);
      
      // Clean the phone number for storage (remove formatting)
      const cleanedPhone = phoneNumber.replace(/\D/g, '');
      
      // Update the employee in database
      const result = await client.models.Employee.update({
        id: employee.id,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phoneNumber: cleanedPhone,
        role: role,
        hourlyRate: hourlyRate ? parseFloat(hourlyRate) : undefined,
        status: status,
        permissions: permissionsString,
      });
      
      if (result.errors) {
        throw new Error(result.errors.map(e => e.message).join(', '));
      }
      
      if (result.data) {
        console.log('Updated employee:', result.data);
        onEmployeeUpdated(result.data);
        onClose();
      } else {
        throw new Error('No data returned from employee update');
      }
    } catch (error: any) {
      console.error('Error updating employee:', error);
      Alert.alert('Error', `Failed to update employee: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render permissions section
  const renderPermissionsSection = () => (
    <View style={styles.permissionSection}>
      <Text style={styles.permissionSectionTitle}>Permissions</Text>
      
      {Object.entries(permissions).map(([key, value]) => (
        <TouchableOpacity 
          key={key}
          style={styles.permissionItem}
          onPress={() => togglePermission(key as keyof EmployeePermissions)}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Icon 
              name={value ? 'checkbox-marked' : 'checkbox-blank-outline'} 
              size={24} 
              color={value ? '#4CAF50' : '#999'} 
            />
            <View style={{ marginLeft: 10, flex: 1 }}>
              <Text style={styles.permissionLabel}>
                {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
              </Text>
              <Text style={styles.permissionDescription}>
                {getPermissionDescription(key as keyof EmployeePermissions)}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  // Get description for each permission
  const getPermissionDescription = (permission: keyof EmployeePermissions): string => {
    const descriptions: Record<keyof EmployeePermissions, string> = {
      manageEmployees: 'Add, edit, and remove employees',
      manageCustomers: 'Add, edit, and remove customers',
      manageProducts: 'Add, edit, and remove products and services',
      manageOrders: 'Create and manage customer orders',
      viewReports: 'Access business reports and analytics',
      processTransactions: 'Process payments and transactions',
      manageSettings: 'Change business settings and configurations'
    };
    
    return descriptions[permission] || '';
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Employee</Text>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Icon name="close" style={styles.closeIcon} />
              </TouchableOpacity>
            </View>

            <ScrollView>
              {/* Form Fields */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>First Name *</Text>
                <TextInput
                  style={[styles.input, errors.firstName && { borderColor: '#F44336' }]}
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="Enter first name"
                />
                {errors.firstName && <Text style={styles.errorText}>{errors.firstName}</Text>}
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Last Name *</Text>
                <TextInput
                  style={[styles.input, errors.lastName && { borderColor: '#F44336' }]}
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Enter last name"
                />
                {errors.lastName && <Text style={styles.errorText}>{errors.lastName}</Text>}
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Email *</Text>
                <TextInput
                  style={[styles.input, errors.email && { borderColor: '#F44336' }]}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter email address"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Phone Number *</Text>
                <TextInput
                  style={[styles.input, errors.phoneNumber && { borderColor: '#F44336' }]}
                  value={phoneNumber}
                  onChangeText={handlePhoneChange}
                  placeholder="(123) 456-7890"
                  keyboardType="phone-pad"
                />
                {errors.phoneNumber && <Text style={styles.errorText}>{errors.phoneNumber}</Text>}
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Role *</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={role}
                    onValueChange={(itemValue) => setRole(itemValue as EmployeeRole)}
                  >
                    <Picker.Item label="Admin" value={EmployeeRole.ADMIN} />
                    <Picker.Item label="Manager" value={EmployeeRole.MANAGER} />
                    <Picker.Item label="Staff" value={EmployeeRole.STAFF} />
                  </Picker>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Hourly Rate</Text>
                <TextInput
                  style={[styles.input, errors.hourlyRate && { borderColor: '#F44336' }]}
                  value={hourlyRate}
                  onChangeText={setHourlyRate}
                  placeholder="Enter hourly rate"
                  keyboardType="decimal-pad"
                />
                {errors.hourlyRate && <Text style={styles.errorText}>{errors.hourlyRate}</Text>}
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Hire Date *</Text>
                <TouchableOpacity
                  style={styles.input}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text>{hireDate.toLocaleDateString()}</Text>
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={hireDate}
                    mode="date"
                    display="default"
                    onChange={handleDateChange}
                  />
                )}
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Status *</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={status}
                    onValueChange={(itemValue) => setStatus(itemValue as EmployeeStatus)}
                  >
                    <Picker.Item label="Active" value={EmployeeStatus.ACTIVE} />
                    <Picker.Item label="Inactive" value={EmployeeStatus.INACTIVE} />
                    <Picker.Item label="Suspended" value={EmployeeStatus.SUSPENDED} />
                  </Picker>
                </View>
              </View>

              {/* Permissions Section */}
              {renderPermissionsSection()}

              {/* Submit Button */}
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  (!isFormValid || isSubmitting) && styles.disabledButton
                ]}
                onPress={handleUpdateEmployee}
                disabled={!isFormValid || isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={styles.submitButtonText}>Update Employee</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default EmployeeDetailModal;
