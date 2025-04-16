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
import { createBusiness, updateBusiness, deleteBusiness } from '../store/slices/BusinessSlice';

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
  onBusinessCreated?: () => void;
}

export default function CreateFormModal({
  visible,
  onClose,
  params,
  type,
  createOrEdit,
  onBusinessCreated
}: CreateFormModalProps): JSX.Element {
  // Track form changes to enable/disable reset button
  const [formChanged, setFormChanged] = useState(false);
  const formRef = useRef<FormRef>(null);
  const [loading, setLoading] = useState(false);
  const [isFormValid, setIsFormValid] = useState(true);
  
  // Update form validity state whenever the form changes
  useEffect(() => {
    // Only check validity if the form has changed and the form has an isFormValid method
    if (formChanged && formRef.current?.isFormValid) {
      const currentFormValid = formRef.current.isFormValid();
      setIsFormValid(currentFormValid);
    }
  }, [formChanged]);

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
  const businessLoading = useSelector((state: RootState) => 
    type === 'Business' ? state.business.isLoading : false
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
    console.log('handleSubmit called');
    
    if (!formRef.current) {
      console.log('formRef is null');
      return;
    }

    try {
      setLoading(true);
      console.log('About to validate form data');
      const formData = await formRef.current.validateAndGetFormData();
      console.log('Form data result:', formData);

      if (!formData) {
        console.log('Form data is null or undefined');
        setLoading(false);
        return;
      }
      
      if (!formData.valid) {
        console.log('Form validation failed:', formData?.message);
        setLoading(false);
        if (formData.message) {
            Alert.alert("Validation Error", formData.message);
        }
        return; // Validation failed
      }
      
      console.log('Form validation passed, proceeding with submission');
      
      // Extract business data without the valid flag if it exists
      const { valid, ...cleanedData } = formData;

      // Handle submission based on form type
      switch (type) {
        case 'Business':
          if (createOrEdit === 'create') {
            console.log('Attempting to create business with data:', cleanedData);
            try {
              const resultAction = await dispatch(createBusiness({ 
                businessData: cleanedData, 
                userId: user?.userId || '' 
              }));
              console.log('Create business action result:', resultAction);
            
              if (createBusiness.fulfilled.match(resultAction)) {
                console.log('Business creation succeeded');
                Alert.alert("Success", "Business created successfully!");
                if (onBusinessCreated) onBusinessCreated();
                onClose();
              } else if (createBusiness.rejected.match(resultAction)) {
                console.log('Business creation failed:', resultAction.payload);
                Alert.alert("Error", `Failed to create business: ${resultAction.payload}`);
              } else {
                console.log('Business creation returned unexpected result');
              }
            } catch (error) {
              const dispatchError = error as Error;
              console.log('Error dispatching createBusiness:', dispatchError);
              Alert.alert("Error", `Failed to create business: ${dispatchError.message || 'Unknown error'}`);
            }
          } else {
            const resultAction = await dispatch(updateBusiness({ 
              businessData: cleanedData, 
              userId: user?.userId || '' 
            }));
            
            if (updateBusiness.fulfilled.match(resultAction)) {
              Alert.alert("Success", "Business updated successfully!");
              onClose();
            } else if (updateBusiness.rejected.match(resultAction)) {
              Alert.alert("Error", `Failed to update business: ${resultAction.payload}`);
            }
          }
          break;
          
        case 'Customer':
          if (createOrEdit === 'create') {
            console.log('Attempting to create customer with data:', cleanedData);
            try {
              const resultAction = await dispatch(createCustomer({ 
                customerData: cleanedData, 
                userId: user?.userId || '' 
              }));
              console.log('Create customer action result:', resultAction);
              
              if (createCustomer.fulfilled.match(resultAction)) {
                console.log('Customer creation succeeded');
                Alert.alert("Success", "Customer created successfully!");
                onClose();
              } else if (createCustomer.rejected.match(resultAction)) {
                console.log('Customer creation failed:', resultAction.payload);
                Alert.alert("Error", `Failed to create customer: ${resultAction.payload}`);
              } else {
                console.log('Customer creation returned unexpected result');
              }
            } catch (error) {
              const dispatchError = error as Error;
              console.log('Error dispatching createCustomer:', dispatchError);
              Alert.alert("Error", `Failed to create customer: ${dispatchError.message || 'Unknown error'}`);
            }
          } else {
            const resultAction = await dispatch(updateCustomer({ 
              customerData: cleanedData, 
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
              employeeData: cleanedData, 
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
              employeeData: cleanedData, 
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
              categoryData: cleanedData, 
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
              categoryData: cleanedData, 
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
            // ItemSlice expects the data directly, not wrapped in an object
            const itemData = {
              ...cleanedData,
              userId: user?.userId || ''
            };
            const resultAction = await dispatch(createItem(itemData));
            
            if (createItem.fulfilled.match(resultAction)) {
              Alert.alert("Success", "Product created successfully!");
              onClose();
            } else if (createItem.rejected.match(resultAction)) {
              Alert.alert("Error", `Failed to create product: ${resultAction.payload}`);
            }
          } else {
            // ItemSlice expects the data directly, not wrapped in an object
            const itemData = {
              ...cleanedData,
              userId: user?.userId || ''
            };
            const resultAction = await dispatch(updateItem(itemData));
            
            if (updateItem.fulfilled.match(resultAction)) {
              Alert.alert("Success", "Product updated successfully!");
              onClose();
            } else if (updateItem.rejected.match(resultAction)) {
              Alert.alert("Error", `Failed to update product: ${resultAction.payload}`);
            }
          }
          break;
          
        // Business case is now handled above
        // The old implementation using params.createBusiness and params.updateBusiness has been replaced with Redux actions
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
                  
                case 'Business':
                  const businessEntityId = params.business?.id;
                  if (!businessEntityId) {
                    throw new Error('Business ID is required for deletion');
                  }
                  
                  const businessResult = await dispatch(deleteBusiness(businessEntityId));
                  
                  if (deleteBusiness.fulfilled.match(businessResult)) {
                    Alert.alert("Success", "Business deleted successfully!");
                    onClose();
                  } else if (deleteBusiness.rejected.match(businessResult)) {
                    Alert.alert("Error", `Failed to delete business: ${businessResult.payload}`);
                  }
                  break;
                  
                case 'Category':
                  const categoryId = params.category?.id;
                  if (!categoryId) {
                    throw new Error('Service ID is required for deletion');
                  }
                  
                  const categoryResult = await dispatch(deleteCategory(categoryId));
                  
                  if (deleteCategory.fulfilled.match(categoryResult)) {

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

          <ScrollView
            style={styles.formContainer}
            contentContainerStyle={{
              paddingBottom: 24,
              alignItems: 'center',
              justifyContent: 'center',
              display: 'flex',
            }}
            keyboardShouldPersistTaps="handled"
          >
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
                  onPress={() => {
                    console.log('Create button clicked');
                    // Direct call to handleSubmit without any conditions
                    if (formRef.current) {
                      handleSubmit();
                    }
                  }}
                  loading={loading}
                  style={styles.buttonSpacing}
                  disabled={false}
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
  },
  modalContent: {
    flex: 1, // <--- Add this
    backgroundColor: 'white',
    paddingTop: 20,
    borderRadius: 18,
    width: '90%',
    maxWidth: 500,
    minWidth: 320,
    maxHeight: '70%',
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    justifyContent: 'flex-start',
    display: 'flex',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    alignSelf: 'center',
  },
  formContainer: {
    flex: 1,
    width: '100%',
    alignSelf: 'stretch',
    padding: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 6,
    paddingBottom: 20,
    alignSelf: 'center',
    borderTopColor: '#eee',
  },
  leftButtons: {
    flexDirection: 'row',
  },
  rightButtons: {
    flexDirection: 'row',
  },
  buttonSpacing: {
    marginHorizontal: 20,
  }
});