import { useState, useEffect } from "react";
import { StyleSheet, View, Text, TextInput, Alert, ScrollView, Switch, Image, TouchableOpacity, Platform } from "react-native";
import * as ImagePicker from 'expo-image-picker';
import { uploadData } from 'aws-amplify/storage';
import CancelResetCreateButtons from "../../../components/CancelResetCreateButtons";
import type { Schema } from "../../../../amplify/data/resource";
import { generateClient } from "aws-amplify/data";
import { Ionicons } from "@expo/vector-icons";

const client = generateClient<Schema>();

interface ProductFormProps {
  onCloseModal: () => void;
  createOrEdit: 'create' | 'edit';
  params: Record<string, any>;
}

export default function ProductForm({ onCloseModal, createOrEdit, params }: ProductFormProps) {
  const existingProduct = createOrEdit === 'edit' ? params?.product : null;
  const selectedServiceId = params?.selectedServiceId;
  
  const [name, setName] = useState(existingProduct?.name || '');
  const [description, setDescription] = useState(existingProduct?.description || '');
  const [price, setPrice] = useState(existingProduct?.price?.toString() || '');
  const [duration, setDuration] = useState(existingProduct?.duration?.toString() || '');
  const [taxable, setTaxable] = useState(existingProduct?.taxable || false);
  const [imageUrl, setImageUrl] = useState(existingProduct?.imageUrl || '');
  const [isFormValid, setIsFormValid] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [useLocalImage, setUseLocalImage] = useState(false);
  const [localImage, setLocalImage] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Get functions from params
  const { userId, createProduct, updateProduct, deleteProduct } = params;

  // Request permissions for image library access
  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to upload images.');
        }
      }
    })();
  }, []);

  useEffect(() => {
    // Validate form
    const isValid = name.trim().length > 0 && 
                    price.trim().length > 0 && 
                    parseFloat(price) > 0 &&
                    selectedServiceId !== null;
    setIsFormValid(isValid);
  }, [name, price, selectedServiceId]);

  const resetForm = () => {
    if (createOrEdit === 'edit' && existingProduct) {
      // Reset to original values
      setName(existingProduct.name || '');
      setDescription(existingProduct.description || '');
      setPrice(existingProduct.price?.toString() || '');
      setDuration(existingProduct.duration?.toString() || '');
      setTaxable(existingProduct.taxable || false);
      setImageUrl(existingProduct.imageUrl || '');
      setLocalImage(null);
      setUseLocalImage(false);
    } else {
      // Clear form
      setName('');
      setDescription('');
      setPrice('');
      setDuration('');
      setTaxable(false);
      setImageUrl('');
      setLocalImage(null);
      setUseLocalImage(false);
    }
    
    Alert.alert('Form Reset', 'The form has been reset to its initial state.');
  };

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

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setLocalImage(result.assets[0].uri);
        setUseLocalImage(true);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const uploadImage = async () => {
    if (!localImage) return null;
    
    try {
      // Get file extension
      const extension = localImage.split('.').pop() || 'jpg';
      
      // Create unique filename
      const fileName = `products/${Date.now()}.${extension}`;
      
      // Fetch the image as a blob
      const response = await fetch(localImage);
      const blob = await response.blob();
      
      // Define the key for S3
      const s3Key = `public/product-images/${fileName}`; // Or adjust path as needed

      // Upload to S3 using the 'key' and 'options' structure
      const result = await uploadData({
        key: s3Key, 
        data: blob,
        options: {
          onProgress: ({ transferredBytes, totalBytes }: { transferredBytes: number; totalBytes: number }) => {
            if (totalBytes) {
              const percentage = Math.round((transferredBytes / totalBytes) * 100);
              setUploadProgress(percentage);
              console.log(`Upload progress: ${percentage}%`);
            }
          },
          // You might need to specify contentType here if needed
          // contentType: `image/${extension}` 
        }
      }).result;
      
      console.log('Upload successful, S3 Key:', s3Key);
      // Use s3Key for the imagePath state
      return s3Key;
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'Failed to upload image. Please try again.');
      return null;
    }
  };

  const handleCreateOrUpdate = async (formData: any) => {
    setIsLoading(true);
    
    try {
      // Upload image if using local image
      let finalImageUrl = imageUrl;
      
      if (useLocalImage && localImage) {
        const uploadedImageKey = await uploadImage();
        if (uploadedImageKey) {
          finalImageUrl = uploadedImageKey;
        } else {
          throw new Error('Failed to upload image');
        }
      }
      
      // Format values
      const formattedPrice = parseFloat(price);
      const formattedDuration = duration ? parseInt(duration) : undefined;
      
      // Prepare data
      const productData = {
        ...formData,
        price: formattedPrice,
        duration: formattedDuration,
        taxable,
        imageUrl: finalImageUrl,
        categoryId: selectedServiceId
      };
      
      // Create or update
      if (createOrEdit === 'edit') {
        await updateProduct(productData);
      } else {
        await createProduct(productData);
      }

      Alert.alert(
        "Success", 
        `Product ${createOrEdit === 'edit' ? 'updated' : 'created'} successfully!`
      );
      onCloseModal();
    } catch (error) {
      console.error(`Error ${createOrEdit === 'edit' ? 'updating' : 'creating'} product:`, error);
      Alert.alert(
        "Error", 
        `Failed to ${createOrEdit === 'edit' ? 'update' : 'create'} product.`
      );
    } finally {
      setIsLoading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async (data: any) => {
    try {
      await deleteProduct(data);
      return Promise.resolve();
    } catch (error) {
      console.error("Error deleting product:", error);
      return Promise.reject(error);
    }
  };

  return (
    <ScrollView style={styles.scrollContainer}>
      <View style={styles.container}>
        <View style={styles.formContainer}>
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

          <View style={styles.imageSourceContainer}>
            <Text style={styles.label}>Image Source</Text>
            <View style={styles.imageSourceOptions}>
              <TouchableOpacity
                style={[styles.sourceOption, !useLocalImage && styles.selectedSource]}
                onPress={() => setUseLocalImage(false)}
              >
                <Text style={styles.sourceOptionText}>URL</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sourceOption, useLocalImage && styles.selectedSource]}
                onPress={() => setUseLocalImage(true)}
              >
                <Text style={styles.sourceOptionText}>Device</Text>
              </TouchableOpacity>
            </View>
          </View>

          {!useLocalImage ? (
            <>
              <Text style={styles.label}>Image URL</Text>
              <TextInput
                placeholder="Enter image URL"
                value={imageUrl}
                onChangeText={setImageUrl}
                style={styles.input}
                placeholderTextColor="#A0A0A0"
              />
            </>
          ) : (
            <View style={styles.imagePickerContainer}>
              <TouchableOpacity
                style={styles.imagePicker}
                onPress={pickImage}
              >
                {localImage ? (
                  <Image source={{ uri: localImage }} style={styles.previewImage} />
                ) : (
                  <>
                    <Ionicons name="camera" size={24} color="#666" />
                    <Text style={styles.imagePickerText}>Select Image</Text>
                  </>
                )}
              </TouchableOpacity>
              {uploadProgress > 0 && uploadProgress < 100 && (
                <View style={styles.progressContainer}>
                  <View style={[styles.progressBar, { width: `${uploadProgress}%` }]} />
                  <Text style={styles.progressText}>{`${Math.round(uploadProgress)}%`}</Text>
                </View>
              )}
            </View>
          )}
        </View>

        <View style={styles.buttonContainer}>
          <CancelResetCreateButtons
            onCancel={onCloseModal}
            onReset={resetForm}
            onCreate={handleCreateOrUpdate}
            isValid={isFormValid}
            isLoading={isLoading}
            entityType="Product"
            isEdit={createOrEdit === 'edit'}
            data={{
              id: existingProduct?.id,
              name,
              description,
              price,
              duration,
              taxable,
              imageUrl,
              categoryId: selectedServiceId
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
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  imageSourceContainer: {
    marginBottom: 15,
  },
  imageSourceOptions: {
    flexDirection: 'row',
    marginTop: 5,
  },
  sourceOption: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 10,
    borderRadius: 5,
  },
  selectedSource: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  sourceOptionText: {
    fontSize: 14,
    color: '#333',
  },
  imagePickerContainer: {
    marginBottom: 15,
  },
  imagePicker: {
    height: 150,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#ddd',
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  imagePickerText: {
    marginTop: 8,
    color: '#666',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 5,
  },
  progressContainer: {
    height: 20,
    width: '100%',
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    marginTop: 5,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#007AFF',
  },
  progressText: {
    position: 'absolute',
    width: '100%',
    textAlign: 'center',
    color: '#fff',
    fontSize: 12,
    lineHeight: 20,
  },
  buttonContainer: {
    marginTop: 10,
  },
});