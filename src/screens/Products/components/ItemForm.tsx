// src/screens/Products/components/ItemForm.tsx
import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { StyleSheet, View, Text, TextInput, Alert, ScrollView, Switch } from "react-native";
import CustomImagePicker from '../../../components/ImagePicker';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';

interface ItemFormProps {
  onCloseModal: () => void;
  createOrEdit: 'create' | 'edit';
  params: Record<string, any>;
  onFormChange?: () => void;
}

const ItemForm = forwardRef(({
  onCloseModal,
  createOrEdit,
  params,
  onFormChange
}: ItemFormProps, ref) => {
  // Get existing item and current category if in edit mode
  const existingItem = createOrEdit === 'edit' ? params?.item : null;
  const categoryId = params?.categoryId || existingItem?.categoryId;

  // Form state
  const [name, setName] = useState(existingItem?.name || '');
  const [description, setDescription] = useState(existingItem?.description || '');
  const [price, setPrice] = useState(existingItem?.price?.toString() || '');
  const [duration, setDuration] = useState(existingItem?.duration?.toString() || '');
  const [taxable, setTaxable] = useState(existingItem?.taxable || false);
  const [imageUrl, setImageUrl] = useState(existingItem?.imageUrl || '');

  // Get loading state from Redux store
  const isReduxLoading = useSelector((state: RootState) => state.item.isLoading);

  // Notify parent component when form changes
  useEffect(() => {
    if (onFormChange) {
      onFormChange();
    }
  }, [name, description, price, duration, taxable, imageUrl]);

  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    resetForm: () => {
      if (createOrEdit === 'edit' && existingItem) {
        // Reset to original values
        setName(existingItem.name || '');
        setDescription(existingItem.description || '');
        setPrice(existingItem.price?.toString() || '');
        setDuration(existingItem.duration?.toString() || '');
        setTaxable(existingItem.taxable || false);
        setImageUrl(existingItem.imageUrl || '');
      } else {
        // Clear form
        setName('');
        setDescription('');
        setPrice('');
        setDuration('');
        setTaxable(false);
        setImageUrl('');
      }
    },
    validateAndGetFormData: () => {
      // Basic validation
      if (!name.trim()) {
        Alert.alert("Validation Error", "Product name is required");
        return null;
      }

      if (!price || price.trim() === '' || isNaN(parseFloat(price))) {
        Alert.alert("Validation Error", "Valid price is required");
        return null;
      }

      if (!categoryId) {
        Alert.alert("Validation Error", "Category ID is missing");
        return null;
      }

      // Create data object with properly defined structure
      const formattedPrice = parseFloat(price);
      const formattedDuration = duration && duration.trim() !== '' 
        ? parseInt(duration, 10) 
        : undefined;

      const itemData = {
        name: name.trim(),
        description: description.trim() || undefined,
        price: formattedPrice,
        duration: formattedDuration,
        taxable,
        imageUrl: imageUrl.trim() || undefined,
        categoryId
      };

      // Add ID if editing
      if (createOrEdit === 'edit' && existingItem?.id) {
        return {
          ...itemData,
          id: existingItem.id
        };
      }

      return itemData;
    },
    isFormValid: () => {
      return name.trim() !== '' && 
             price !== '' && 
             !isNaN(parseFloat(price)) && 
             parseFloat(price) > 0 && 
             !!categoryId;
    }
  }));

  const handlePriceChange = (text: string) => {
    // Only allow numbers and decimal point
    const filteredText = text.replace(/[^0-9.]/g, '');
    setPrice(filteredText);
  };

  const handleDurationChange = (text: string) => {
    // Only allow numbers
    const filteredText = text.replace(/[^0-9]/g, '');
    setDuration(filteredText);
  };

  return (
    <ScrollView style={styles.scrollContainer}>
      <View style={styles.container}>
        <Text style={styles.label}>Product Name*</Text>
        <TextInput
          placeholder="Enter product name"
          value={name}
          onChangeText={setName}
          style={styles.input}
          placeholderTextColor="#A0A0A0"
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          placeholder="Enter product description"
          value={description}
          onChangeText={setDescription}
          style={[styles.input, styles.multilineInput]}
          multiline={true}
          numberOfLines={3}
          placeholderTextColor="#A0A0A0"
        />

        <Text style={styles.label}>Price ($)*</Text>
        <TextInput
          placeholder="Enter price"
          value={price}
          onChangeText={handlePriceChange}
          style={styles.input}
          keyboardType="decimal-pad"
          placeholderTextColor="#A0A0A0"
        />

        <Text style={styles.label}>Duration (minutes)</Text>
        <TextInput
          placeholder="Enter duration in minutes"
          value={duration}
          onChangeText={handleDurationChange}
          style={styles.input}
          keyboardType="number-pad"
          placeholderTextColor="#A0A0A0"
        />

        <View style={styles.switchContainer}>
          <Text style={styles.label}>Taxable</Text>
          <Switch
            value={taxable}
            onValueChange={setTaxable}
            trackColor={{ false: "#767577", true: "#81b0ff" }}
            thumbColor={taxable ? "#f5dd4b" : "#f4f3f4"}
          />
        </View>

        <Text style={styles.label}>Product Image</Text>
        <CustomImagePicker
          imageUri={imageUrl}
          onImageSelected={setImageUrl}
          height={180}
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
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  }
});

export default ItemForm;