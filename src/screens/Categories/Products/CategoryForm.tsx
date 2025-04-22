import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, TextInput } from 'react-native';
import FormModal from '../../../components/FormModal';
import CrudButtons from '../../../components/CrudButtons';
import type { Category } from '../../../types';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../../amplify/data/resource';
import { useAuthenticator } from '@aws-amplify/ui-react-native';
import { addCategory, updateCategory, deleteCategory } from '../../../localdb/services/categoryService';

const client = generateClient<Schema>();

interface CategoryFormProps {
  visible: boolean;
  businessId?: string;
  onClose: () => void;
  onSuccess?: (category?: Category) => void;
  category?: Category | null;
}

const initialState = {
  name: '',
  color: '',
};

const CategoryForm: React.FC<CategoryFormProps> = ({
  visible,
  businessId,
  onClose,
  onSuccess,
  category = null,
}) => {
  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user: authUser } = useAuthenticator((context) => [context.user]);

  useEffect(() => {
    if (visible) {
      if (category) {
        setForm({
          name: category.name || '',
          color: category.color || '',
        });
      } else {
        setForm(initialState);
      }
      setError(null);
    }
  }, [category, visible]);

  useEffect(() => {
    if (error) Alert.alert('Error', error);
  }, [error]);

  const handleChange = (field: keyof typeof initialState, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleReset = () => {
    if (category) {
      setForm({
        name: category.name || '',
        color: category.color || '',
      });
    } else {
      setForm(initialState);
    }
    setError(null);
  };

  const handleDelete = async () => {
    Alert.alert(
      'Delete Category',
      'Are you sure you want to delete this category?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              setError(null);
              await deleteCategory(category!._id);
              if (onSuccess) onSuccess();
              onClose();
            } catch (err: any) {
              setError(err.message || 'Error deleting category');
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);
      if (!form.name) {
        setError('Name is required');
        return;
      }
      if (category) {
        // Update
        await updateCategory(category._id, {
          name: form.name,
          color: form.color,
        });
        if (onSuccess) onSuccess({ ...category, ...form });
      } else {
        // Create
        const newCategory: Category = {
          _id: Date.now().toString(), // or use your preferred ID generator
          name: form.name,
          color: form.color,
          businessId,
        };
        await addCategory(newCategory);
        if (onSuccess) onSuccess(newCategory);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error saving category');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = () => {
    return !!form.name;
  };

  return (
    <FormModal visible={visible} onClose={onClose} title={category ? 'Edit Category' : 'Add New Category'}>
      <View style={styles.form}>
        <Text style={styles.label}>Name *</Text>
        <TextInput
          style={styles.input}
          value={form.name}
          onChangeText={text => handleChange('name', text)}
          placeholder="Category Name"
        />
        <Text style={styles.label}>Color</Text>
        <TextInput
          style={styles.input}
          value={form.color}
          onChangeText={text => handleChange('color', text)}
          placeholder="Color (hex or name, optional)"
        />
        <Text style={styles.requiredFields}>* Required fields</Text>
        <CrudButtons
          onCreate={!category ? handleSubmit : undefined}
          onUpdate={category ? handleSubmit : undefined}
          onDelete={category ? handleDelete : undefined}
          onReset={handleReset}
          onCancel={onClose}
          isSubmitting={loading}
          showCreate={!category}
          showUpdate={!!category}
          showDelete={!!category}
          showReset
          showCancel
          disabled={!isFormValid()}
        />
      </View>
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

export default CategoryForm;
