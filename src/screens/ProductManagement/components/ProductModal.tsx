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
import { Product } from '../../../shared/types/productTypes';

interface ProductModalProps {
  visible: boolean;
  isNewProduct: boolean;
  product: Product | null;
  onClose: () => void;
  onSave: (productData: {
    name: string;
    description: string;
    price: string;
    imageUrl: string;
  }) => void;
  onDelete?: () => void;
}

const ProductModal: React.FC<ProductModalProps> = ({
  visible,
  isNewProduct,
  product,
  onClose,
  onSave,
  onDelete,
}) => {
  // Form state
  const [productName, setProductName] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productUrlPicture, setProductUrlPicture] = useState('');

  // Reset form when product changes
  useEffect(() => {
    if (product) {
      setProductName(product.name);
      setProductDescription(product.description || '');
      setProductPrice(product.price.toString());
      setProductUrlPicture(product.urlPicture || '');
    } else {
      setProductName('');
      setProductDescription('');
      setProductPrice('');
      setProductUrlPicture('');
    }
  }, [product]);

  // Validate form and save
  const handleSave = () => {
    // Validate required fields
    if (!productName.trim() || !productPrice.trim()) {
      Alert.alert('Error', 'Product name and price are required.');
      return;
    }

    if (isNaN(parseFloat(productPrice))) {
      Alert.alert('Error', 'Please enter a valid price');
      return;
    }

    // Call onSave with form data
    onSave({
      name: productName,
      description: productDescription,
      price: productPrice,
      imageUrl: productUrlPicture,
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
            {isNewProduct ? 'Add New Product' : 'Edit Product'}
          </Text>
          
          {/* Form fields */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Product Name *</Text>
            <TextInput
              style={styles.formInput}
              value={productName}
              onChangeText={setProductName}
              placeholder="Enter product name"
            />
          </View>
  
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Description</Text>
            <TextInput
              style={[styles.formInput, styles.textArea]}
              value={productDescription}
              onChangeText={setProductDescription}
              placeholder="Enter product description"
              multiline
              numberOfLines={3}
            />
          </View>
  
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Price *</Text>
            <TextInput
              style={styles.formInput}
              value={productPrice}
              onChangeText={setProductPrice}
              placeholder="Enter price"
              keyboardType="numeric"
            />
          </View>
  
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Image URL</Text>
            <TextInput
              style={styles.formInput}
              value={productUrlPicture}
              onChangeText={setProductUrlPicture}
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

export default ProductModal;