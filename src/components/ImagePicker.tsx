// src/components/ImagePicker.tsx
import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView, Modal } from 'react-native';
import * as ImagePickerLib from 'react-native-image-picker';
import { getImageSource, getAssetImageNames } from '../utils/productImages';

interface ProductImagePickerProps {
  currentImage: string;
  onImageSelected: (imageSource: string) => void;
}

const ProductImagePicker: React.FC<ProductImagePickerProps> = ({ 
  currentImage, 
  onImageSelected 
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const availableImages = getAssetImageNames();

  const openCamera = () => {
    ImagePickerLib.launchCamera({
      mediaType: 'photo',
      includeBase64: false,
      maxHeight: 500,
      maxWidth: 500,
    }, (response) => {
      if (response.assets && response.assets[0]?.uri) {
        onImageSelected(response.assets[0].uri);
        setModalVisible(false);
      }
    });
  };

  const openGallery = () => {
    ImagePickerLib.launchImageLibrary({
      mediaType: 'photo',
      includeBase64: false,
      maxHeight: 500,
      maxWidth: 500,
    }, (response) => {
      if (response.assets && response.assets[0]?.uri) {
        onImageSelected(response.assets[0].uri);
        setModalVisible(false);
      }
    });
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.previewContainer} 
        onPress={() => setModalVisible(true)}
      >
        <Image 
          source={getImageSource(currentImage)}
          style={styles.previewImage}
        />
        {currentImage && (currentImage.startsWith('http') || currentImage.startsWith('file:')) && (
          <Text style={styles.uriLabel}>From Gallery/Camera</Text>
        )}
        <Text style={styles.changeText}>Change Image</Text>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Image</Text>
            
            <View style={styles.sourceButtons}>
              <TouchableOpacity style={styles.sourceButton} onPress={openCamera}>
                <Text style={styles.buttonText}>Camera</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.sourceButton} onPress={openGallery}>
                <Text style={styles.buttonText}>Gallery</Text>
              </TouchableOpacity>
            </View>
            
            <Text style={styles.sectionTitle}>App Assets</Text>
            <ScrollView style={styles.assetList}>
              <View style={styles.imageGrid}>
                {availableImages.map((imageName) => (
                  <TouchableOpacity
                    key={imageName}
                    style={[
                      styles.assetItem,
                      currentImage === imageName && styles.selectedAsset
                    ]}
                    onPress={() => {
                      onImageSelected(imageName);
                      setModalVisible(false);
                    }}
                  >
                    <Image
                      source={getImageSource(imageName)}
                      style={styles.assetImage}
                    />
                    <Text style={styles.assetName} numberOfLines={1}>
                      {imageName.replace(/_/g, ' ')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  previewContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 8,
    backgroundColor: '#f9f9f9',
  },
  previewImage: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
  },
  changeText: {
    marginTop: 8,
    color: '#007AFF',
    fontWeight: '600',
  },
  uriLabel: {
    marginTop: 4,
    color: '#FF9500',
    fontSize: 12,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  sourceButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  sourceButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    width: '45%',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  assetList: {
    maxHeight: 300,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  assetItem: {
    width: '30%',
    marginBottom: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    alignItems: 'center',
  },
  selectedAsset: {
    borderColor: '#34C759',
    borderWidth: 2,
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
  },
  assetImage: {
    width: 60,
    height: 60,
    resizeMode: 'contain',
  },
  assetName: {
    fontSize: 10,
    textAlign: 'center',
    marginTop: 4,
  },
  closeButton: {
    backgroundColor: '#FF3B30',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  closeButtonText: {
    color: 'white',
    fontWeight: 'bold',
  }
});

export default ProductImagePicker;