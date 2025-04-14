import React, { useState, useRef, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, Alert, ScrollView } from 'react-native';
import { CreateButton, UpdateButton, DeleteButton, ResetButton, CancelButton } from './ButtonComponents';
import BusinessForm from '../components/BusinessForm';
import CustomerForm from '../screens/Customers/components/CustomerForm';
import EmployeeForm from '../screens/Employees/components/EmployeeForm';
import { useBusinessData } from '../hooks/useBusinessData';
import { useCustomersData } from '../screens/Customers/hooks/useCustomerData';
import { useEmployeesData } from '../screens/Employees/hooks/useEmployeeData';
import { useAuthenticator } from '@aws-amplify/ui-react-native';

// Define FormRef interface to use with useRef
export interface FormRef {
  resetForm: () => void;
  validateAndGetFormData: () => any;
  isFormValid?: () => boolean;
}

interface CreateFormModalProps {
  visible: boolean;
  onClose: () => void;
  params: Record<string, any>;
  type: 'Business' | 'Customer' | 'Employee';
  createOrEdit: 'create' | 'edit';
  resetForm: () => void;
}

export default function CreateFormModal({
  visible,
  onClose,
  params,
  type,
  createOrEdit
}: CreateFormModalProps): JSX.Element {
  // Track form changes to enable/disable reset button
  const [formChanged, setFormChanged] = useState(false);
  const formRef = useRef<FormRef>(null);
  const [loading, setLoading] = useState(false);
  const [isFormValid, setIsFormValid] = useState(true);

  // Get current user for hooks
  const { user } = useAuthenticator((context) => [context.user]);

  // Initialize hooks based on type
  const { createBusiness, updateBusiness, deleteBusiness } = useBusinessData(user);
  const { createCustomer, updateCustomer, deleteCustomer } = useCustomersData(user);
  const { createEmployee, updateEmployee, deleteEmployee } = useEmployeesData(user);

  // Reset form handler - to be passed to form components
  const handleReset = () => {
    Alert.alert(
      "Reset Form",
      "Are you sure you want to reset all fields?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          onPress: () => {
            // Call resetForm method on the form ref
            formRef.current?.resetForm();
            setFormChanged(false);
          },
          style: "destructive"
        }
      ]
    );
  };

  // Generic handler for form submission
  const handleSubmit = async () => {
    if (!formRef.current) return;

    try {
      setLoading(true);
      const formData = formRef.current.validateAndGetFormData();

      if (!formData) {
        setLoading(false);
        return; // Validation failed
      }

      if (createOrEdit === 'create') {
        switch (type) {
          case 'Business':
            await createBusiness(formData);
            break;
          case 'Customer':
            await createCustomer(formData);
            break;
          case 'Employee':
            await createEmployee(formData);
            break;
        }
        Alert.alert("Success", `${type} created successfully!`);
      } else {
        switch (type) {
          case 'Business':
            await updateBusiness(formData);
            break;
          case 'Customer':
            await updateCustomer(formData);
            break;
          case 'Employee':
            await updateEmployee(formData);
            break;
        }
        Alert.alert("Success", `${type} updated successfully!`);
      }

      setLoading(false);
      onClose();
    } catch (error) {
      setLoading(false);
      Alert.alert("Error", `Failed to ${createOrEdit} ${type}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Handle delete operation
  const handleDelete = async () => {
    Alert.alert(
      "Confirm Delete",
      `Are you sure you want to delete this ${type}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          onPress: async () => {
            try {
              setLoading(true);
              let id;
              switch (type) {
                case 'Business':
                  id = params.business?.id;
                  await deleteBusiness(id);
                  break;
                case 'Customer':
                  id = params.customer?.id;
                  await deleteCustomer(id);
                  break;
                case 'Employee':
                  id = params.employee?.id;
                  await deleteEmployee(id);
                  break;
              }

              setLoading(false);
              Alert.alert("Success", `${type} deleted successfully!`);
              onClose();
            } catch (error) {
              setLoading(false);
              Alert.alert("Error", `Failed to delete ${type}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
          },
          style: "destructive"
        }
      ]
    );
  };

  // Add an effect to check form validity when the form changes
  useEffect(() => {
    // If the form has an isFormValid method, use it
    if (formRef.current?.isFormValid) {
      setIsFormValid(formRef.current.isFormValid());
    } else {
      // Otherwise, assume valid (for non-Customer forms or forms without validation)
      setIsFormValid(true);
    }
  }, [formChanged]);
  console.log('Form state:', {
    isFormValid,
    hasValidationMethod: !!formRef.current?.isFormValid,
    type,
    createOrEdit
  });
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>
            {createOrEdit === 'create' ? `Create ${type}` : `Edit ${type}`}
          </Text>

          <ScrollView style={styles.formContainer}>
            {type === 'Business' && (
              <BusinessForm
                ref={formRef}
                onCloseModal={onClose}
                createOrEdit={createOrEdit}
                params={params}
                onFormChange={() => setFormChanged(true)}
              />
            )}
            {type === 'Customer' && (
              <CustomerForm
                ref={formRef}
                onCloseModal={onClose}
                createOrEdit={createOrEdit}
                params={params}
                onFormChange={() => setFormChanged(true)}
              />
            )}
            {type === 'Employee' && (
              <EmployeeForm
                ref={formRef}
                onCloseModal={onClose}
                createOrEdit={createOrEdit}
                params={params}
                onFormChange={() => setFormChanged(true)}
              />
            )}
          </ScrollView>

          <View style={styles.buttonContainer}>
            <View style={styles.leftButtons}>
              <CancelButton
                onPress={onClose}
                style={styles.buttonSpacing}
              />
              <ResetButton
                onPress={handleReset}
                disabled={!formChanged}
                style={styles.buttonSpacing}
              />
            </View>

            <View style={styles.rightButtons}>
              {createOrEdit === 'create' ? (
                <CreateButton
                  onPress={handleSubmit}
                  loading={loading}
                  style={styles.buttonSpacing}
                  disabled={!isFormValid}
                />
              ) : (
                <>
                  <DeleteButton
                    onPress={handleDelete}
                    loading={loading}
                    style={styles.buttonSpacing}
                  />
                  <UpdateButton
                    onPress={handleSubmit}
                    loading={loading}
                    style={styles.buttonSpacing}
                    disabled={!isFormValid}
                  />
                </>
              )}
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingBottom: 10,
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '90%',
    maxHeight: '80%',
    paddingBottom: 0,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  formContainer: {
    maxHeight: '75%',
  },
  buttonContainer: {
    marginTop: 35,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 5,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  leftButtons: {
    flexDirection: 'row',
  },
  rightButtons: {
    flexDirection: 'row',
  },
  buttonSpacing: {
    marginHorizontal: 5,
  }
});