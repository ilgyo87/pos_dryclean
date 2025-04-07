// src/screens/EmployeeManagement/components/CreateEmployeeModal.tsx
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
import QRCodeCapture from '../../../shared/components/QRCodeCapture';
import { 
  generateQRCodeData, 
  attachQRCodeKeyToEntity 
} from '../../../shared/components/qrCodeGenerator';
import QRCode from 'react-native-qrcode-svg';

const client = generateClient<Schema>();

interface CreateEmployeeModalProps {
  visible: boolean;
  onClose: () => void;
  onEmployeeCreated: (employee: Employee) => void;
  businessId: string;
}

const CreateEmployeeModal: React.FC<CreateEmployeeModalProps> = ({
  visible,
  onClose,
  onEmployeeCreated,
  businessId
}) => {
  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [role, setRole] = useState(EmployeeRole.STAFF);
  const [hourlyRate, setHourlyRate] = useState('');
  const [hireDate, setHireDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [status, setStatus] = useState(EmployeeStatus.ACTIVE);
  
  // Permissions state (default all to false)
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
  
  // QR code states
  const [qrCodeString, setQrCodeString] = useState<string | null>(null);
  const [tempEmployee, setTempEmployee] = useState<Partial<Employee> | null>(null);
  const [newEmployeeId, setNewEmployeeId] = useState<string | null>(null);
  const [qrCaptureVisible, setQrCaptureVisible] = useState(false);
  const [createdEmployee, setCreatedEmployee] = useState<Employee | null>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (visible) {
      resetForm();
    }
  }, [visible]);

  // Validate form fields on change
  useEffect(() => {
    validateForm();
  }, [firstName, lastName, email, phoneNumber, role, hourlyRate]);

  // Generate QR code data for preview when employee info is ready
  useEffect(() => {
    if (firstName && lastName && businessId) {
      // Create a temporary employee object for QR code generation
      const tempEmployeeData = {
        id: 'temp-id', // Will be replaced with actual ID after creation
        firstName,
        lastName,
        email,
        phoneNumber,
        role,
        businessID: businessId,
      };
      
      setTempEmployee(tempEmployeeData);

      // Generate QR code data string
      const qrData = generateQRCodeData('Employee', tempEmployeeData as any);
      setQrCodeString(qrData);
    } else {
      setQrCodeString(null);
    }
  }, [firstName, lastName, email, phoneNumber, role, businessId]);

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setEmail('');
    setPhoneNumber('');
    setRole(EmployeeRole.STAFF);
    setHourlyRate('');
    setHireDate(new Date());
    setStatus(EmployeeStatus.ACTIVE);
    setPermissions({
      manageEmployees: false,
      manageCustomers: false,
      manageProducts: false,
      manageOrders: false,
      viewReports: false,
      processTransactions: false,
      manageSettings: false
    });
    setIsSubmitting(false);
    setErrors({});
    setQrCodeString(null);
    setTempEmployee(null);
    setNewEmployeeId(null);
    setQrCaptureVisible(false);
    setCreatedEmployee(null);
  };

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

  // Handle QR Code Complete
  const handleQrComplete = async (qrCodeKey: string | null) => {
    setQrCaptureVisible(false); // Hide scanner view

    if (!createdEmployee) {
      Alert.alert('Error', 'Employee data is missing');
      setIsSubmitting(false);
      return;
    }

    try {
      if (qrCodeKey) {
        console.log(`QR Code captured/uploaded for employee ${createdEmployee.id}. Attaching key: ${qrCodeKey}`);
        // Attach QR code key to employee record
        const success = await attachQRCodeKeyToEntity('Employee', createdEmployee.id, qrCodeKey);

        if (success) {
          console.log(`Successfully attached QR key to employee ${createdEmployee.id}`);
          // Update local employee object with QR code URL
          const updatedEmployee = { ...createdEmployee, qrCode: qrCodeKey };
          onEmployeeCreated(updatedEmployee);
        } else {
          Alert.alert('Warning', 'Employee created, but failed to attach QR code');
          onEmployeeCreated(createdEmployee);
        }
      } else {
        // User skipped QR code generation
        console.log('QR code generation skipped');
        onEmployeeCreated(createdEmployee);
      }

      onClose(); // Close modal regardless
    } catch (error) {
      console.error('Error during QR attachment/handling:', error);
      Alert.alert('Error', 'Failed during QR step, but employee was created');
      onEmployeeCreated(createdEmployee);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateEmployee = async () => {
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    try {
      // Convert permissions object to JSON string
      const permissionsString = JSON.stringify(permissions);
      
      // Clean the phone number for storage (remove formatting)
      const cleanedPhone = phoneNumber.replace(/\D/g, '');
      
      // First create the employee in database
      const result = await client.models.Employee.create({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phoneNumber: cleanedPhone,
        role: role,
        hourlyRate: hourlyRate ? parseFloat(hourlyRate) : undefined,
        hireDate: hireDate.toISOString(),
        status: status,
        permissions: permissionsString,
        businessID: businessId,
        // cognitoUserId will need to be set when you implement user authentication
        cognitoUserId: 'placeholder-id' // This is a placeholder
      });
      
      if (result.errors) {
        throw new Error(result.errors.map(e => e.message).join(', '));
      }
      
      if (result.data) {
        console.log('Created employee:', result.data);
        setCreatedEmployee(result.data);
        setNewEmployeeId(result.data.id);
        
        // Show QR code capture component
        setQrCaptureVisible(true);
      } else {
        throw new Error('No data returned from employee creation');
      }
    } catch (error: any) {
      console.error('Error creating employee:', error);
      Alert.alert('Error', `Failed to create employee: ${error.message}`);
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
              <Text style={styles.modalTitle}>Add New Employee</Text>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Icon name="close" style={styles.closeIcon} />
              </TouchableOpacity>
            </View>

            {/* QR Code Capture (conditionally rendered) */}
            {qrCaptureVisible && qrCodeString && newEmployeeId ? (
              <QRCodeCapture
                value={qrCodeString}
                size={200}
                entityType="Employee"
                entityId={newEmployeeId}
                onCapture={handleQrComplete}
              />
            ) : (
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

                {/* QR Code Preview */}
                {qrCodeString && (
                  <View style={styles.qrCodeContainer}>
                    <Text style={styles.label}>Employee QR Code Preview</Text>
                    <View style={styles.qrCodeWrapper}>
                      {/* Use the QRCode component from react-native-qrcode-svg */}
                      <QRCode
                        value={qrCodeString}
                        size={150}
                        backgroundColor="white"
                        color="black"
                      />
                    </View>
                    <Text style={styles.noQrText}>
                      This QR code will be generated for the employee
                    </Text>
                  </View>
                )}

                {/* Submit Button */}
                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    (!isFormValid || isSubmitting) && styles.disabledButton
                  ]}
                  onPress={handleCreateEmployee}
                  disabled={!isFormValid || isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <Text style={styles.submitButtonText}>Create Employee</Text>
                  )}
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default CreateEmployeeModal;
