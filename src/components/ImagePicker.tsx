import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, FlatList } from 'react-native';
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
}

const ImagePicker: React.FC<ImagePickerProps> = ({ value, onChange }) => {
  const [selected, setSelected] = useState(value || '');

  const handleSelect = (imageName: string) => {
    setSelected(imageName);
    onChange(imageName);
  };

  return (
    <View style={styles.container}>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: { fontWeight: '600', marginBottom: 8 },
  grid: { alignItems: 'center' },
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
