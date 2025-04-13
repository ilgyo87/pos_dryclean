import React, { useRef } from 'react';
import { View, TextInput, StyleSheet, Pressable, Text } from 'react-native';

type PinInputProps = {
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
};

const PinInput = ({ value, onChange, maxLength }: PinInputProps) => {
  const inputRef = useRef<TextInput>(null);

  // Handle numeric input only
  const handleChange = (text: string) => {
    // Remove non-numeric characters
    const numericValue = text.replace(/[^0-9]/g, '');
    
    // Limit to maxLength
    if (numericValue.length <= maxLength) {
      onChange(numericValue);
    }
  };

  // Focus the hidden input when container is pressed
  const focusInput = () => {
    inputRef.current?.focus();
  };

  // Create an array of individual PIN digit boxes
  const renderDigitBoxes = () => {
    const boxes = [];
    
    for (let i = 0; i < maxLength; i++) {
      boxes.push(
        <View key={i} style={styles.digitBox}>
          <Text style={styles.digit}>
            {value.length > i ? '•' : ''}
          </Text>
        </View>
      );
    }
    
    return boxes;
  };

  return (
    <Pressable style={styles.container} onPress={focusInput}>
      <View style={styles.boxesContainer}>
        {renderDigitBoxes()}
      </View>
      
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={handleChange}
        keyboardType="numeric"
        style={styles.hiddenInput}
        maxLength={maxLength}
        secureTextEntry
      />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  boxesContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 20,
  },
  digitBox: {
    width: 50,
    height: 60,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginHorizontal: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  digit: {
    fontSize: 24,
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    height: 0,
    width: '100%',
    bottom: 0,
  },
});

export default PinInput;