import React, { useState } from 'react';
import { View, TouchableOpacity, Image, StyleSheet, Text, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

interface ImagePickerProps {
  imageUri: string | null;
  onImageSelected: (uri: string | null) => void;
  height?: number;
}

const CustomImagePicker: React.FC<ImagePickerProps> = ({ 
  imageUri, 
  onImageSelected,
  height = 150
}) => {
  const [loading, setLoading] = useState(false);

  const requestPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'We need permission to access your photos to set product images.'
      );
      return false;
    }
    return true;
  };

  const selectImage = async () => {
    try {
      const hasPermission = await requestPermission();
      if (!hasPermission) return;

      setLoading(true);
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      setLoading(false);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImageUri = result.assets[0].uri;
        onImageSelected(selectedImageUri);
      }
    } catch (error) {
      setLoading(false);
      console.error('Error selecting image:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };

  const removeImage = () => {
    onImageSelected(null);
  };

  return (
    <View style={[styles.container, { height }]}>
      {imageUri ? (
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: imageUri }} 
            style={styles.image}
            resizeMode="cover"
          />
          <TouchableOpacity 
            style={styles.removeButton}
            onPress={removeImage}
          >
            <Ionicons name="close-circle" size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.changeButton}
            onPress={selectImage}
          >
            <Text style={styles.changeText}>Change</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity 
          style={styles.placeholder}
          onPress={selectImage}
          disabled={loading}
        >
          <Ionicons name="camera-outline" size={32} color="#999" />
          <Text style={styles.placeholderText}>
            {loading ? 'Loading...' : 'Select Image'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 150,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
  },
  imageContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    padding: 4,
  },
  changeButton: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 8,
    alignItems: 'center',
  },
  changeText: {
    color: 'white',
    fontWeight: 'bold',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  placeholderText: {
    marginTop: 8,
    color: '#666',
  },
});

export default CustomImagePicker;
