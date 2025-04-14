import React, { useState, useRef, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, Alert, ScrollView } from 'react-native';
import { CreateButton, UpdateButton, DeleteButton, ResetButton, CancelButton } from './ButtonComponents';
import BusinessForm from '../components/BusinessForm';
import CustomerForm from '../screens/Customers/components/CustomerForm';
import EmployeeForm from '../screens/Employees/components/EmployeeForm';
import { useAuthenticator } from '@aws-amplify/ui-react-native';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import { createCustomer, updateCustomer, deleteCustomer } from '../store/slices/CustomerSlice';
import { createEmployee, updateEmployee, deleteEmployee } from '../store/slices/EmployeeSlice';

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
  
  // Redux hooks
  const dispatch = useDispatch<AppDispatch>();
  
  // Get loading state based on entity type
  const customerLoading = useSelector((state: RootState) => 
    type === 'Customer' ? state.customer.isLoading : false
  );
  const employeeLoading = useSelector((state: RootState) => 
    type === 'Employee' ? state.employee.isLoading : false
  );

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

      // Handle submission based on form type
      if (type === 'Customer') {
        if (createOrEdit === 'create') {
          // Dispatch create action with userId
          const resultAction = await dispatch(createCustomer({ 
            customerData: formData, 
            userId: user?.userId || '' 
          }));
          
          if (createCustomer.fulfilled.match(resultAction)) {
            Alert.alert("Success", "Customer created successfully!");
            onClose();
          } else if (createCustomer.rejected.match(resultAction)) {
            Alert.alert("Error", `Failed to create customer: ${resultAction.payload}`);
          }
        } else {
          // Dispatch update action with userId
          const resultAction = await dispatch(updateCustomer({ 
            customerData: formData, 
            userId: user?.userId || '' 
          }));
          
          if (updateCustomer.fulfilled.match(resultAction)) {
            Alert.alert("Success", "Customer updated successfully!");
            onClose();
          } else if (updateCustomer.rejected.match(resultAction)) {
            Alert.alert("Error", `Failed to update customer: ${resultAction.payload}`);
          }
        }
      } else if (type === 'Employee') {
        if (createOrEdit === 'create') {
          // Dispatch create action with userId
          const resultAction = await dispatch(createEmployee({ 
            employeeData: formData, 
            userId: user?.userId || '' 
          }));
          
          if (createEmployee.fulfilled.match(resultAction)) {
            Alert.alert("Success", "Employee created successfully!");
            onClose();
          } else if (createEmployee.rejected.match(resultAction)) {
            Alert.alert("Error", `Failed to create employee: ${resultAction.payload}`);
          }
        } else {
          // Dispatch update action with userId
          const resultAction = await dispatch(updateEmployee({ 
            employeeData: formData, 
            userId: user?.userId || '' 
          }));
          
          if (updateEmployee.fulfilled.match(resultAction)) {
            Alert.alert("Success", "Employee updated successfully!");
            onClose();
          } else if (updateEmployee.rejected.match(resultAction)) {
            Alert.alert("Error", `Failed to update employee: ${resultAction.payload}`);
          }
        }
      } else {
        // For Business type, use the methods from params
        if (createOrEdit === 'create') {
          if (type === 'Business' && params.createBusiness) {
            await params.createBusiness(formData);
          }
          Alert.alert("Success", `${type} created successfully!`);
        } else {
          if (type === 'Business' && params.updateBusiness) {
            await params.updateBusiness(formData);
          }
          Alert.alert("Success", `${type} updated successfully!`);
        }
        onClose();
      }
    } catch (error) {
      Alert.alert("Error", `Failed to ${createOrEdit} ${type}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
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
              
              if (type === 'Customer') {
                // Use Redux for Customer delete
                const customerId = params.customer?.id;
                if (!customerId) {
                  throw new Error('Customer ID is required for deletion');
                }
                
                const resultAction = await dispatch(deleteCustomer(customerId));
                
                if (deleteCustomer.fulfilled.match(resultAction)) {
                  Alert.alert("Success", "Customer deleted successfully!");
                  onClose();
                } else if (deleteCustomer.rejected.match(resultAction)) {
                  Alert.alert("Error", `Failed to delete customer: ${resultAction.payload}`);
                }
              } else if (type === 'Employee') {
                // Use Redux for Employee delete
                const employeeId = params.employee?.id;
                if (!employeeId) {
                  throw new Error('Employee ID is required for deletion');
                }
                
                const resultAction = await dispatch(deleteEmployee(employeeId));
                
                if (deleteEmployee.fulfilled.match(resultAction)) {
                  Alert.alert("Success", "Employee deleted successfully!");
                  onClose();
                } else if (deleteEmployee.rejected.match(resultAction)) {
                  Alert.alert("Error", `Failed to delete employee: ${resultAction.payload}`);
                }
              } else {
                // Use params methods for Business type
                let id;
                if (type === 'Business') {
                  id = params.business?.id;
                  await params.deleteBusiness(id);
                }

                Alert.alert("Success", `${type} deleted successfully!`);
                onClose();
              }
            } catch (error) {
              Alert.alert("Error", `Failed to delete ${type}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            } finally {
              setLoading(false);
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
      // Otherwise, assume valid (for Business forms or forms without validation)
      setIsFormValid(true);
    }
  }, [formChanged]);
  
  // Set loading state from Redux based on entity type
  useEffect(() => {
    if (type === 'Customer') {
      setLoading(customerLoading);
    } else if (type === 'Employee') {
      setLoading(employeeLoading);
    }
  }, [customerLoading, employeeLoading, type]);

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