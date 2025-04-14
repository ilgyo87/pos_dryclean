// src/screens/Products/components/CategoryForm.tsx
import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { StyleSheet, View, Text, TextInput, Alert, ScrollView } from "react-native";
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';

interface CategoryFormProps {
  onCloseModal: () => void;
  createOrEdit: 'create' | 'edit';
  params: Record<string, any>;
  onFormChange?: () => void;
}

const CategoryForm = forwardRef(({
  onCloseModal,
  createOrEdit,
  params,
  onFormChange
}: CategoryFormProps, ref) => {
  // Get existing category if in edit mode
  const existingCategory = createOrEdit === 'edit' ? params?.category : null;

  // Form state
  const [name, setName] = useState(existingCategory?.name || '');
  const [description, setDescription] = useState(existingCategory?.description || '');
  const [price, setPrice] = useState(existingCategory?.price?.toString() || '');
  const [imageUrl, setImageUrl] = useState(existingCategory?.imageUrl || '');

  // Get loading state from Redux store
  const isReduxLoading = useSelector((state: RootState) => state.category.isLoading);

  // Notify parent component when form changes
  useEffect(() => {
    if (onFormChange) {
      onFormChange();
    }
  }, [name, description, price, imageUrl]);

  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    resetForm: () => {
      if (createOrEdit === 'edit' && existingCategory) {
        // Reset to original values
        setName(existingCategory.name || '');
        setDescription(existingCategory.description || '');
        setPrice(existingCategory.price?.toString() || '');
        setImageUrl(existingCategory.imageUrl || '');
      } else {
        // Clear form
        setName('');
        setDescription('');
        setPrice('');
        setImageUrl('');
      }
    },
    validateAndGetFormData: () => {
      console.log('CategoryForm.validateAndGetFormData called');
      
      // Basic validation
      if (!name.trim()) {
        console.log('Service name is required');
        return { valid: false, message: "Service name is required" };
      }

      console.log('Category validation passed');
      
      // Create data object with properly defined structure
      const formattedPrice = price && price.trim() !== '' 
        ? parseFloat(price) 
        : undefined;

      const categoryData = {
        name: name.trim(),
        description: description.trim() || undefined,
        price: formattedPrice,
        imageUrl: imageUrl.trim() || undefined,
        valid: true // Add valid flag for successful validation
      };

      console.log('Category data being returned:', categoryData);
      
      // Add ID if editing
      if (createOrEdit === 'edit' && existingCategory?.id) {
        return {
          ...categoryData,
          id: existingCategory.id
        };
      }

      return categoryData;
    },
    isFormValid: () => {
      return name.trim() !== '';
    }
  }));

  const handlePriceChange = (text: string) => {
    // Only allow numbers and decimal point
    const filteredText = text.replace(/[^0-9.]/g, '');
    setPrice(filteredText);
  };

  return (
    <ScrollView style={styles.scrollContainer}>
      <View style={styles.container}>
        <Text style={styles.label}>Service Name*</Text>
        <TextInput
          placeholder="Enter service name"
          value={name}
          onChangeText={setName}
          style={styles.input}
          placeholderTextColor="#A0A0A0"
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          placeholder="Enter service description"
          value={description}
          onChangeText={setDescription}
          style={[styles.input, styles.multilineInput]}
          multiline={true}
          numberOfLines={3}
          placeholderTextColor="#A0A0A0"
        />

        <Text style={styles.label}>Base Price ($)</Text>
        <TextInput
          placeholder="Enter base price (optional)"
          value={price}
          onChangeText={handlePriceChange}
          style={styles.input}
          keyboardType="decimal-pad"
          placeholderTextColor="#A0A0A0"
        />

        <Text style={styles.label}>Image URL</Text>
        <TextInput
          placeholder="Enter image URL (optional)"
          value={imageUrl}
          onChangeText={setImageUrl}
          style={styles.input}
          placeholderTextColor="#A0A0A0"
        />
      </View>
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  scrollContainer: {
    maxHeight: '80%',
  },
  container: {
    padding: 10,
  },
  label: {
    marginBottom: 5,
    fontWeight: '500',
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
  },
  multilineInput: {
    height: 100,
    textAlignVertical: 'top',
  }
});

export default CategoryForm;