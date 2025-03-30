import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { styles } from '../styles/screens/productManagementStyles';
import { Service } from '../types/productTypes';

interface ServiceModalProps {
  visible: boolean;
  isNewService: boolean;
  service: Service | null;
  onClose: () => void;
  onSave: (serviceData: {
    name: string;
    description: string;
    price: string;
    category?: string;
    urlPicture: string;
  }) => void;
  onDelete?: () => void;
}

const ServiceModal: React.FC<ServiceModalProps> = ({
  visible,
  isNewService,
  service,
  onClose,
  onSave,
  onDelete,
}) => {
  // Form state
  const [serviceName, setServiceName] = useState('');
  const [serviceDescription, setServiceDescription] = useState('');
  const [servicePrice, setServicePrice] = useState('');
  const [serviceCategory, setServiceCategory] = useState('');
  const [serviceUrlPicture, setServiceUrlPicture] = useState('');

  // Reset form when service changes
  useEffect(() => {
    if (service) {
      setServiceName(service.name);
      setServiceDescription(service.description || '');
      setServicePrice(service.price.toString());
      setServiceUrlPicture(service.urlPicture || '');
    } else {
      setServiceName('');
      setServiceDescription('');
      setServicePrice('');
      setServiceUrlPicture('');
    }
  }, [service]);

  // Validate form and save
  const handleSave = () => {
    // Validate required fields
    if (!serviceName.trim()) {
      Alert.alert('Error', 'Service name is required');
      return;
    }

    if (!servicePrice.trim() || isNaN(parseFloat(servicePrice))) {
      Alert.alert('Error', 'Please enter a valid price');
      return;
    }

    // Call onSave with form data
    onSave({
      name: serviceName,
      description: serviceDescription,
      price: servicePrice,
      category: serviceCategory,
      urlPicture: serviceUrlPicture,
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
              value={serviceName}
              onChangeText={setServiceName}
              placeholder="Enter service name"
            />
          </View>
  
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Description</Text>
            <TextInput
              style={[styles.formInput, styles.textArea]}
              value={serviceDescription}
              onChangeText={setServiceDescription}
              placeholder="Enter service description"
              multiline
              numberOfLines={3}
            />
          </View>
  
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Price *</Text>
            <TextInput
              style={styles.formInput}
              value={servicePrice}
              onChangeText={setServicePrice}
              placeholder="Enter price"
              keyboardType="numeric"
            />
          </View>
  
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Image URL</Text>
            <TextInput
              style={styles.formInput}
              value={serviceUrlPicture}
              onChangeText={setServiceUrlPicture}
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

export default ServiceModal;