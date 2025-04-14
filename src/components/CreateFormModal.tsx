import React, { useState, useRef, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, Alert, ScrollView } from 'react-native';
import { CreateButton, UpdateButton, DeleteButton, ResetButton, CancelButton } from './ButtonComponents';
import BusinessForm from '../components/BusinessForm';
import CustomerForm from '../screens/Customers/components/CustomerForm';
import EmployeeForm from '../screens/Employees/components/EmployeeForm';
import CategoryForm from '../screens/Products/components/CategoryForm';
import ItemForm from '../screens/Products/components/ItemForm';
import { useAuthenticator } from '@aws-amplify/ui-react-native';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import { createCustomer, updateCustomer, deleteCustomer } from '../store/slices/CustomerSlice';
import { createEmployee, updateEmployee, deleteEmployee } from '../store/slices/EmployeeSlice';
import { createCategory, updateCategory, deleteCategory } from '../store/slices/CategorySlice';
import { createItem, updateItem, deleteItem } from '../store/slices/ItemSlice';

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
  type: 'Business' | 'Customer' | 'Employee' | 'Category' | 'Item';
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
  const categoryLoading = useSelector((state: RootState) => 
    type === 'Category' ? state.category.isLoading : false
  );
  const itemLoading = useSelector((state: RootState) => 
    type === 'Item' ? state.item.isLoading : false
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
      switch (type) {
        case 'Customer':
          if (createOrEdit === 'create') {
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
          break;
          
        case 'Employee':
          if (createOrEdit === 'create') {
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
          break;
          
        case 'Category':
          if (createOrEdit === 'create') {
            const resultAction = await dispatch(createCategory({ 
              categoryData: formData, 
              userId: user?.userId || '' 
            }));
            
            if (createCategory.fulfilled.match(resultAction)) {
              Alert.alert("Success", "Service created successfully!");
              onClose();
            } else if (createCategory.rejected.match(resultAction)) {
              Alert.alert("Error", `Failed to create service: ${resultAction.payload}`);
            }
          } else {
            const resultAction = await dispatch(updateCategory({ 
              categoryData: formData, 
              userId: user?.userId || '' 
            }));
            
            if (updateCategory.fulfilled.match(resultAction)) {
              Alert.alert("Success", "Service updated successfully!");
              onClose();
            } else if (updateCategory.rejected.match(resultAction)) {
              Alert.alert("Error", `Failed to update service: ${resultAction.payload}`);
            }
          }
          break;
          
        case 'Item':
          if (createOrEdit === 'create') {
            const resultAction = await dispatch(createItem(formData));
            
            if (createItem.fulfilled.match(resultAction)) {
              Alert.alert("Success", "Product created successfully!");
              onClose();
            } else if (createItem.rejected.match(resultAction)) {
              Alert.alert("Error", `Failed to create product: ${resultAction.payload}`);
            }
          } else {
            const resultAction = await dispatch(updateItem(formData));
            
            if (updateItem.fulfilled.match(resultAction)) {
              Alert.alert("Success", "Product updated successfully!");
              onClose();
            } else if (updateItem.rejected.match(resultAction)) {
              Alert.alert("Error", `Failed to update product: ${resultAction.payload}`);
            }
          }
          break;
          
        case 'Business':
          // For Business type, use the methods from params
          if (createOrEdit === 'create') {
            if (params.createBusiness) {
              await params.createBusiness(formData);
            }
            Alert.alert("Success", `${type} created successfully!`);
          } else {
            if (params.updateBusiness) {
              await params.updateBusiness(formData);
            }
            Alert.alert("Success", `${type} updated successfully!`);
          }
          onClose();
          break;
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
              
              switch (type) {
                case 'Customer':
                  const customerId = params.customer?.id;
                  if (!customerId) {
                    throw new Error('Customer ID is required for deletion');
                  }
                  
                  const customerResult = await dispatch(deleteCustomer(customerId));
                  
                  if (deleteCustomer.fulfilled.match(customerResult)) {
                    Alert.alert("Success", "Customer deleted successfully!");
                    onClose();
                  } else if (deleteCustomer.rejected.match(customerResult)) {
                    Alert.alert("Error", `Failed to delete customer: ${customerResult.payload}`);
                  }
                  break;
                  
                case 'Employee':
                  const employeeId = params.employee?.id;
                  if (!employeeId) {
                    throw new Error('Employee ID is required for deletion');
                  }
                  
                  const employeeResult = await dispatch(deleteEmployee(employeeId));
                  
                  if (deleteEmployee.fulfilled.match(employeeResult)) {
                    Alert.alert("Success", "Employee deleted successfully!");
                    onClose();
                  } else if (deleteEmployee.rejected.match(employeeResult)) {
                    Alert.alert("Error", `Failed to delete employee: ${employeeResult.payload}`);
                  }
                  break;
                  
                case 'Category':
                  const categoryId = params.category?.id;
                  if (!categoryId) {
                    throw new Error('Service ID is required for deletion');
                  }
                  
                  const categoryResult = await dispatch(deleteCategory(categoryId));
                  
                  if (deleteCategory.fulfilled.match(categoryResult)) {
                    Alert.alert("Success", "Service deleted successfully!");
                    onClose();
                  } else if (deleteCategory.rejected.match(categoryResult)) {
                    Alert.alert("Error", `Failed to delete service: ${categoryResult.payload}`);
                  }
                  break;
                  
                case 'Item':
                  const itemId = params.item?.id;
                  if (!itemId) {
                    throw new Error('Product ID is required for deletion');
                  }
                  
                  const itemResult = await dispatch(deleteItem(itemId));
                  
                  if (deleteItem.fulfilled.match(itemResult)) {
                    Alert.alert("Success", "Product deleted successfully!");
                    onClose();
                  } else if (deleteItem.rejected.match(itemResult)) {
                    Alert.alert("Error", `Failed to delete product: ${itemResult.payload}`);
                  }
                  break;
                  
                case 'Business':
                  const businessId = params.business?.id;
                  if (businessId && params.deleteBusiness) {
                    await params.deleteBusiness(businessId);
                    Alert.alert("Success", `${type} deleted successfully!`);
                    onClose();
                  }
                  break;
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
    switch (type) {
      case 'Customer':
        setLoading(customerLoading);
        break;
      case 'Employee':
        setLoading(employeeLoading);
        break;
      case 'Category':
        setLoading(categoryLoading);
        break;
      case 'Item':
        setLoading(itemLoading);
        break;
    }
  }, [customerLoading, employeeLoading, categoryLoading, itemLoading, type]);

  // Get title text based on entity type
  const getEntityTitle = () => {
    switch (type) {
      case 'Customer':
        return 'Customer';
      case 'Employee':
        return 'Employee';
      case 'Category':
        return 'Service';
      case 'Item':
        return 'Product';
      default:
        return type;
    }
  };

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
            {createOrEdit === 'create' ? `Create ${getEntityTitle()}` : `Edit ${getEntityTitle()}`}
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
            {type === 'Category' && (
              <CategoryForm
                ref={formRef}
                onCloseModal={onClose}
                createOrEdit={createOrEdit}
                params={params}
                onFormChange={() => setFormChanged(true)}
              />
            )}
            {type === 'Item' && (
              <ItemForm
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