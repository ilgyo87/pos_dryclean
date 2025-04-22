import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import FormModal from '../../../components/FormModal';
import CrudButtons from '../../../components/CrudButtons';
import type { Product, Category } from '../../../types';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../../amplify/data/resource';
import { useAuthenticator } from '@aws-amplify/ui-react-native';
import { useProducts } from '../../../hooks/useProducts';

const client = generateClient<Schema>();

interface ProductFormProps {
  visible: boolean;
  businessId?: string;
  categories: Category[];
  onClose: () => void;
  onSuccess?: (product?: Product) => void;
  product?: Product | null;
}

const initialState = {
  name: '',
  description: '',
  price: '',
  categoryId: '',
  imageName: '',
};

const ProductForm: React.FC<ProductFormProps> = ({
  visible,
  businessId,
  categories,
  onClose,
  onSuccess,
  product = null,
}) => {
  const [form, setForm] = useState(initialState);
  const [error, setError] = useState<string | null>(null);
  const { createProduct, editProduct, removeProduct, loading: productsLoading, error: productsError } = useProducts();
  const loading = productsLoading;
  const { user: authUser } = useAuthenticator((context) => [context.user]);

  useEffect(() => {
    if (visible) {
      if (product) {
        setForm({
          name: product.name || '',
          description: product.description || '',
          price: product.price ? String(product.price) : '',
          categoryId: product.categoryId || '',
          imageName: product.imageName || '',
        });
      } else {
        setForm(initialState);
      }
      setError(null);
    }
  }, [product, visible]);

  useEffect(() => {
    if (error) Alert.alert('Error', error);
  }, [error]);

  const handleChange = (field: keyof typeof initialState, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleReset = () => {
    if (product) {
      setForm({
        name: product.name || '',
        description: product.description || '',
        price: product.price ? String(product.price) : '',
        categoryId: product.categoryId || '',
        imageName: product.imageName || '',
      });
    } else {
      setForm(initialState);
    }
    setError(null);
  };

  const handleDelete = async () => {
    Alert.alert(
      'Delete Product',
      'Are you sure you want to delete this product?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              
              setError(null);
              await removeProduct(product!._id);
              if (onSuccess) onSuccess();
              onClose();
            } catch (err: any) {
              setError(err.message || 'Error deleting product');
            } finally {
              
            }
          },
        },
      ],
    );
  };

  const handleSubmit = async () => {
    try {
      
      setError(null);
      const priceNum = parseFloat(form.price);
      if (!form.name || !form.categoryId || isNaN(priceNum)) {
        setError('Name, category, and valid price are required');
        return;
      }
      if (product) {
        // Update
        await editProduct(product._id, {
          name: form.name,
          description: form.description,
          price: priceNum,
          categoryId: form.categoryId,
          imageName: form.imageName,
        });
        if (onSuccess) onSuccess({ ...product, ...form, price: priceNum });
      } else {
        // Create
        const newProduct: Product = {
          _id: Date.now().toString(), // or use your preferred ID generator
          name: form.name,
          description: form.description,
          price: priceNum,
          categoryId: form.categoryId,
          businessId,
          imageName: form.imageName,
        };
        await createProduct(newProduct);
        if (onSuccess) onSuccess(newProduct);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error saving product');
    } finally {
      
    }
  };

  const isFormValid = () => {
    const priceNum = parseFloat(form.price);
    return !!form.name && !!form.categoryId && !isNaN(priceNum);
  };

  return (
    <FormModal visible={visible} onClose={onClose} title={product ? 'Edit Product' : 'Add New Product'}>
      <View style={styles.form}>
        <Text style={styles.label}>Name *</Text>
        <TextInput
          style={styles.input}
          value={form.name}
          onChangeText={text => handleChange('name', text)}
          placeholder="Product Name"
        />
        <Text style={styles.label}>Category *</Text>
        <Text style={styles.label}>Category</Text>
        <View style={styles.radioGroup}>
          {categories.map(cat => (
            <TouchableOpacity
              key={cat._id}
              style={[
                styles.radioButton,
                form.categoryId === cat._id && styles.radioButtonSelected,
              ]}
              onPress={() => handleChange('categoryId', cat._id)}
            >
              <View style={[
                styles.radioOuter,
                form.categoryId === cat._id && styles.radioOuterSelected,
              ]}>
                {form.categoryId === cat._id && <View style={styles.radioInner} />}
              </View>
              <Text style={styles.radioLabel}>{cat.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.label}>Price *</Text>
        <TextInput
          style={styles.input}
          value={form.price}
          onChangeText={text => handleChange('price', text)}
          placeholder="Price"
          keyboardType="numeric"
        />
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, { height: 60 }]}
          value={form.description}
          onChangeText={text => handleChange('description', text)}
          placeholder="Description (optional)"
          multiline
        />
        <Text style={styles.label}>Image</Text>
        <ImagePicker
          value={form.imageName}
          onChange={imageName => handleChange('imageName', imageName)}
        />
        {form.imageName ? (
          <Image
            source={getGarmentImage(form.imageName)}
            style={{ width: 60, height: 60, alignSelf: 'center', marginBottom: 10 }}
            resizeMode="contain"
          />
        ) : null}
        <Text style={styles.requiredFields}>* Required fields</Text>
        <CrudButtons
          onCreate={!product ? handleSubmit : undefined}
          onUpdate={product ? handleSubmit : undefined}
          onDelete={product ? handleDelete : undefined}
          onReset={handleReset}
          onCancel={onClose}
          isSubmitting={loading}
          showCreate={!product}
          showUpdate={!!product}
          showDelete={!!product}
          showReset
          showCancel
          disabled={!isFormValid()}
        />
      </View>
    </FormModal>
  );
};

import { TextInput, Image, TouchableOpacity } from 'react-native';

import ImagePicker from '../../../components/ImagePicker';
import { getGarmentImage } from '../../../utils/ImageMapping';

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
  radioGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
    gap: 8,
  },
  radioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    marginBottom: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fff',
  },
  radioButtonSelected: {
    borderColor: '#007bff',
    backgroundColor: '#e6f0ff',
  },
  radioOuter: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
    backgroundColor: '#fff',
  },
  radioOuterSelected: {
    borderColor: '#007bff',
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007bff',
  },
  radioLabel: {
    fontSize: 14,
    color: '#333',
  },
  requiredFields: {
    color: '#666',
    fontSize: 12,
    marginBottom: 12,
    textAlign: 'right',
  },
});

export default ProductForm;
