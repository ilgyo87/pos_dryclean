import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { styles } from '../styles/productManagementStyles';
import type { Schema } from '../../../../amplify/data/resource';

type Category = Schema['Category']['type'];

interface CategoryModalProps {
  visible: boolean;
  isNewService: boolean;
  category: Category | null;
  onClose: () => void;
  onSave: (serviceData: {
    name: string;
    description: string;
    price: string;
    category?: string;
    imageUrl: string;
  }) => void;
  onDelete?: () => void;
}

const CategoryModal: React.FC<CategoryModalProps> = ({
  visible,
  isNewService,
  category,
  onClose,
  onSave,
  onDelete,
}) => {
  // Form state
  const [categoryName, setCategoryName] = useState('');
  const [categoryDescription, setCategoryDescription] = useState('');
  const [categoryPrice, setCategoryPrice] = useState('');
  const [categoryUrlPicture, setCategoryUrlPicture] = useState('');

  // Reset form when service changes
  useEffect(() => {
    if (category) {
      setCategoryName(category.name);
      setCategoryDescription(category.description || '');
      setCategoryPrice(category.price?.toString() || '');
    } else {
      setCategoryName('');
      setCategoryDescription('');
      setCategoryPrice('');
    }
  }, [category]);

  // Validate form and save
  const handleSave = () => {
    // Validate required fields
    if (!categoryName.trim()) {
      Alert.alert('Error', 'Category name is required');
      return;
    }

    if (!categoryPrice.trim() || isNaN(parseFloat(categoryPrice))) {
      Alert.alert('Error', 'Please enter a valid price');
      return;
    }

    // Call onSave with form data
    onSave({
      name: categoryName,
      description: categoryDescription,
      price: categoryPrice,
      imageUrl: categoryUrlPicture,
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle || { fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>
            {isNewService ? 'Add New Service' : 'Edit Service'}
          </Text>
          
          {/* Form fields */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Service Name *</Text>
            <TextInput
              style={styles.formInput}
              value={categoryName}
              onChangeText={setCategoryName}
              placeholder="Enter service name"
            />
          </View>
  
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Description</Text>
            <TextInput
              style={[styles.formInput, styles.textArea]}
              value={categoryDescription}
              onChangeText={setCategoryDescription}
              placeholder="Enter service description"
              multiline
              numberOfLines={3}
            />
          </View>
  
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Price *</Text>
            <TextInput
              style={styles.formInput}
              value={categoryPrice}
              onChangeText={setCategoryPrice}
              placeholder="Enter price"
              keyboardType="numeric"
            />
          </View>
  
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Image URL</Text>
            <TextInput
              style={styles.formInput}
              value={categoryUrlPicture}
              onChangeText={setCategoryUrlPicture}
              placeholder="Enter image URL"
            />
          </View>
  
          {/* Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
  
            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={handleSave}
            >
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default CategoryModal;