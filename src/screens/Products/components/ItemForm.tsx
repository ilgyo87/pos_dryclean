// src/screens/Products/components/ItemForm.tsx
import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { StyleSheet, View, Text, TextInput, Alert, ScrollView, Switch } from "react-native";
import ProductImagePicker from '../../../components/ImagePicker';
import { Image } from 'react-native';
import { getImageSource } from '../../../utils/productImages';
import { uploadData, getUrl } from '@aws-amplify/storage';

function getEffectiveImageSource(imageSource: string, imageUrl: string) {
  if (imageUrl && imageUrl.trim() !== '') {
    return { uri: imageUrl.trim() };
  } else if (imageSource && imageSource !== 'placeholder') {
    return getImageSource(imageSource);
  } else {
    return getImageSource('placeholder');
  }
}
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
  const [imageSource, setImageSource] = useState(existingItem?.imageSource || 'placeholder');

  // Get loading state from Redux store
  const isReduxLoading = useSelector((state: RootState) => state.item.isLoading);

  // Notify parent component when form changes
  useEffect(() => {
    if (onFormChange) {
      onFormChange();
    }
  }, [name, description, price, duration, taxable, imageUrl, imageSource]);

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
        setImageSource(existingItem.imageSource || 'placeholder');
      } else {
        // Clear form
        setName('');
        setDescription('');
        setPrice('');
        setDuration('');
        setTaxable(false);
        setImageUrl('');
        setImageSource('placeholder');
      }
    },
    validateAndGetFormData: async () => {
      // imageUrlPreferred: true if imageUrl is a valid HTTP(S) URL, else false

      console.log('ItemForm.validateAndGetFormData called');

      // Basic validation
      if (!name.trim()) {
        console.log('Product name is required');
        return { valid: false, message: "Product name is required" };
      }

      if (!price || price.trim() === '' || isNaN(parseFloat(price))) {
        console.log('Valid price is required');
        return { valid: false, message: "Valid price is required" };
      }

      if (!categoryId) {
        console.log('Category ID is missing');
        return { valid: false, message: "Category ID is missing" };
      }

      console.log('Item validation passed');

      // Create data object with properly defined structure
      const formattedPrice = parseFloat(price);
      const formattedDuration = duration && duration.trim() !== ''
        ? parseInt(duration, 10)
        : undefined;

      // --- IMAGE UPLOAD LOGIC ---
      let finalImageUrl: string | undefined = undefined;
      // If a device image is selected, upload and use it
      if (imageSource && imageSource.startsWith('file://')) {
        // Use item name (slugified) as ID for new items, or item ID for edits
        const itemId = (createOrEdit === 'edit' && existingItem?.id)
          ? existingItem.id
          : name.trim().toLowerCase().replace(/\s+/g, '-') + '-' + Date.now();
        try {
          const extension = imageSource.split('.').pop() || 'jpg';
          // Remove 'public/' prefix, Amplify handles it via accessLevel
          const key = `products/${itemId}.${extension}`;
          // Convert file URI to Blob
          const response = await fetch(imageSource);
          const blob = await response.blob();
          await uploadData({ key, data: blob, options: { contentType: `image/${extension}`, accessLevel: 'guest' } }).result;
          const { url } = await getUrl({ key, options: { accessLevel: 'guest' } });
          finalImageUrl = String(url);
        } catch (err) {
          console.error('Image upload failed:', err);
        }
      } else if (imageSource && imageSource !== 'placeholder') {
        // If imageSource is a remote URL (not file://), use it directly
        finalImageUrl = imageSource.trim();
      } else if (imageUrl && imageUrl.trim() !== '') {
        // If imageSource is empty or 'placeholder', use the imageUrl field (user input)
        finalImageUrl = imageUrl.trim();
      }
      // --- END IMAGE UPLOAD LOGIC ---

      function isValidHttpUrl(str: string | undefined): str is string {
        return typeof str === 'string' && /^https?:\/\//.test(str);
      }
      const itemData = {
        name: name.trim(),
        description: description.trim() || undefined,
        price: formattedPrice,
        duration: formattedDuration,
        taxable,
        imageUrl: isValidHttpUrl(finalImageUrl) ? finalImageUrl : undefined,
        imageSource,
        imageUrlPreferred: isValidHttpUrl(finalImageUrl),
        categoryId,
        valid: true // Add valid flag for successful validation
      };

      console.log('Item data being returned:', itemData);

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
        <ProductImagePicker
          currentImage={imageSource}
          onImageSelected={(uri: string) => {
            setImageSource(uri);
            setImageUrl(''); // Clear imageUrl when picking a device image
          }}
        />

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Image URL (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="https://example.com/image.jpg"
            value={imageUrl}
            onChangeText={(text) => {
              setImageUrl(text);
              if (text.trim() !== '') {
                setImageSource(''); // Clear imageSource when entering a URL
              }
            }}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text style={styles.helperText}>
            If you pick an image, it will override the URL for preview and saving. If you remove the picked image, the URL will be used.
          </Text>
        </View>
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
  },
  inputContainer: {
    marginBottom: 15,
  },
  helperText: {
    color: '#666',
    fontSize: 12,
    marginTop: 5,
  },
});

export default ItemForm;