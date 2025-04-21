// src/components/Products/DefaultServicesButton.tsx
import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
} from 'react-native';

interface DefaultServicesButtonProps {
  onPress: () => void;
}

const DefaultServicesButton: React.FC<DefaultServicesButtonProps> = ({
  onPress,
}) => {
  const handlePress = () => {
    Alert.alert(
      "Add Default Services",
      "This will add common dry cleaning services to your catalog.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Add", 
          onPress
        }
      ]
    );
  };

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={handlePress}
    >
      <Text style={styles.buttonText}>Add Default Services</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#f0f8ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#007bff',
  },
  buttonText: {
    color: '#007bff',
    fontWeight: '500',
    fontSize: 14,
  },
});

export default DefaultServicesButton;