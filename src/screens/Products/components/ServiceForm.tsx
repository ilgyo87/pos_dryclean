import { useState, useEffect } from "react";
import { StyleSheet, View, Text, TextInput, Alert, ScrollView, TouchableOpacity } from "react-native";
import CancelResetCreateButtons from "../../../components/CancelResetCreateButtons";
import type { Schema } from "../../../../amplify/data/resource";
import { generateClient } from "aws-amplify/data";

const client = generateClient<Schema>();

interface ServiceFormProps {
  onCloseModal: () => void;
  createOrEdit: 'create' | 'edit';
  params: Record<string, any>;
}

export default function ServiceForm({ onCloseModal, createOrEdit, params }: ServiceFormProps) {
  const existingService = createOrEdit === 'edit' ? params?.service : null;
  const [name, setName] = useState(existingService?.name || '');
  const [description, setDescription] = useState(existingService?.description || '');
  const [price, setPrice] = useState(existingService?.price?.toString() || '');
  const [imageUrl, setImageUrl] = useState(existingService?.imageUrl || '');
  const [isFormValid, setIsFormValid] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Get functions from params
  const { userId, createService, updateService, deleteService } = params;

  useEffect(() => {
    // Validate form
    const isValid = name.trim().length > 0;
    setIsFormValid(isValid);
  }, [name]);

  const resetForm = () => {
    if (createOrEdit === 'edit' && existingService) {
      // Reset to original values
      setName(existingService.name || '');
      setDescription(existingService.description || '');
      setPrice(existingService.price?.toString() || '');
      setImageUrl(existingService.imageUrl || '');
    } else {
      // Clear form
      setName('');
      setDescription('');
      setPrice('');
      setImageUrl('');
    }
    
    Alert.alert('Form Reset', 'The form has been reset to its initial state.');
  };

  const handlePriceChange = (text: string) => {
    // Only allow numbers and decimal point
    const filteredText = text.replace(/[^0-9.]/g, '');
    setPrice(filteredText);
  };

  const handleCreateOrUpdate = async (formData: any) => {
    setIsLoading(true);
    try {
      // Format price from string to number if provided
      const formattedPrice = price && price.trim() !== '' 
        ? parseFloat(price) 
        : undefined;

      // Prepare data
      const serviceData = {
        ...formData,
        price: formattedPrice,
        userId
      };

      // Create or update
      if (createOrEdit === 'edit') {
        await updateService(serviceData);
      } else {
        await createService(serviceData);
      }

      Alert.alert(
        "Success", 
        `Service ${createOrEdit === 'edit' ? 'updated' : 'created'} successfully!`
      );
      onCloseModal();
    } catch (error) {
      console.error(`Error ${createOrEdit === 'edit' ? 'updating' : 'creating'} service:`, error);
      Alert.alert(
        "Error", 
        `Failed to ${createOrEdit === 'edit' ? 'update' : 'create'} service.`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (data: any) => {
    try {
      await deleteService(data);
      return Promise.resolve();
    } catch (error) {
      console.error("Error deleting service:", error);
      return Promise.reject(error);
    }
  };

  return (
    <ScrollView style={styles.scrollContainer}>
      <View style={styles.container}>
        <View style={styles.formContainer}>
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
            placeholder="Enter base price"
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

        <View style={styles.buttonContainer}>
          <CancelResetCreateButtons
            onCancel={onCloseModal}
            onReset={resetForm}
            onCreate={handleCreateOrUpdate}
            isValid={isFormValid}
            isLoading={isLoading}
            entityType="Service"
            isEdit={createOrEdit === 'edit'}
            data={{
              id: existingService?.id,
              name,
              description,
              price,
              imageUrl,
              userId
            }}
            onDelete={createOrEdit === 'edit' ? handleDelete : undefined}
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    maxHeight: '80%',
  },
  container: {
    padding: 20,
    width: '100%',
  },
  formContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  multilineInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    marginTop: 10,
  },
});