import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, FlatList, Modal, Button } from 'react-native';
import { getGarmentImage } from '../utils/ImageMapping';

// List of available image keys (should match the switch cases in getGarmentImage)
const GARMENT_IMAGE_KEYS = [
  'blankets', 'blazer', 'boxed-shirts', 'buttons', 'clothes-cut', 'comforter', 'curtain',
  'dress-shirt', 'dress', 'hem', 'jacket', 'jeans', 'jersey', 'kids-clothes', 'leather-jacket',
  'pants', 'patch', 'pillow', 'polo', 'rug', 'sari', 'sewing', 'shirt-cut', 'shoes', 'skirt',
  'socks', 'suit', 'take-in', 'tshirt', 't-shirt', 'waist', 'washing-clothes', 'wedding-dress',
  'winter-coat', 'winter-hat', 'woman-suit', 'zipper'
];

interface ImagePickerProps {
  value?: string;
  onChange: (imageName: string) => void;
  visible: boolean;
  onClose: () => void;
}

const ImagePicker: React.FC<ImagePickerProps> = ({ value, onChange, visible, onClose }) => {
  const [selected, setSelected] = useState(value || '');

  const handleSelect = (imageName: string) => {
    setSelected(imageName);
  };

  const handleConfirm = () => {
    if (selected) {
      onChange(selected);
    }
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} transparent>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalContent}>
          <Text style={styles.label}>Pick an Image</Text>
          <FlatList
            data={GARMENT_IMAGE_KEYS}
            numColumns={4}
            keyExtractor={item => item}
            renderItem={({ item }) => {
              const image = getGarmentImage(item);
              return (
                <TouchableOpacity
                  style={[styles.imageWrapper, selected === item && styles.selected]}
                  onPress={() => handleSelect(item)}
                >
                  {image ? (
                    <Image source={image} style={styles.image} resizeMode="contain" />
                  ) : (
                    <View style={styles.imagePlaceholder}><Text>?</Text></View>
                  )}
                  <Text style={styles.imageLabel}>{item.replace(/[-_]/g, ' ')}</Text>
                </TouchableOpacity>
              );
            }}
            contentContainerStyle={styles.grid}
          />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 }}>
            <Button title="Cancel" onPress={onClose} color="#888" />
            <Button title="Select" onPress={handleConfirm} disabled={!selected} />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 18,
    width: '92%',
    maxHeight: '85%',
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  container: {
    marginBottom: 16,
    flexGrow: 1,
    minHeight: 120,
    maxHeight: 350,
  },
  label: { fontWeight: '600', marginBottom: 8 },
  grid: { alignItems: 'center', flexGrow: 1 },
  imageWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    margin: 6,
    borderWidth: 2,
    borderColor: 'transparent',
    borderRadius: 8,
    padding: 6,
    width: 70,
    height: 90,
    backgroundColor: '#fafafa',
  },
  selected: {
    borderColor: '#007bff',
    backgroundColor: '#e6f0ff',
  },
  image: {
    width: 40,
    height: 40,
  },
  imagePlaceholder: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eee',
    borderRadius: 6,
  },
  imageLabel: {
    fontSize: 10,
    marginTop: 4,
    textAlign: 'center',
    color: '#555',
  },
});

export default ImagePicker;
