import React, { useRef, useEffect } from 'react';
import { View, TextInput, StyleSheet, Pressable, Text, Modal, TouchableWithoutFeedback } from 'react-native';

type PinInputProps = {
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
  isVisible: boolean;
  onClose: () => void;
  onSubmit?: () => void;
  title?: string;
};

export function PinInput({ 
  value, 
  onChange, 
  maxLength, 
  isVisible,
  onClose,
  onSubmit,
  title = "Enter PIN" 
}: PinInputProps) {
  const inputRef = useRef<TextInput>(null);
  const pinValueRef = useRef(value);
  
  // Update the ref when the value prop changes
  useEffect(() => {
    pinValueRef.current = value;
  }, [value]);

  const handleChange = (text: string) => {
    const numericValue = text.replace(/[^0-9]/g, '');
    
    if (numericValue.length <= maxLength) {
      onChange(numericValue);
      pinValueRef.current = numericValue;
      
      // Auto-submit when all digits are entered
      if (numericValue.length === maxLength && onSubmit) {
        // Use a small delay to ensure UI is updated
        setTimeout(() => {
          console.log('Submitting with PIN from ref:', pinValueRef.current);
          onSubmit();
        }, 300);
      }
    }
  };

  const focusInput = () => {
    inputRef.current?.focus();
  };

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
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={focusInput}>
            <View style={styles.modalContent}>
              <Text style={styles.title}>{title}</Text>
              
              <View style={styles.pinContainer} onTouchStart={focusInput}>
                {renderDigitBoxes()}
              </View>
              
              <TextInput
                ref={inputRef}
                value={value}
                onChangeText={handleChange}
                style={styles.hiddenInput}
                keyboardType="numeric"
                maxLength={maxLength}
                autoFocus
                secureTextEntry
              />
              
              <Pressable 
                style={styles.cancelButton} 
                onPress={onClose}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  pinContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  digitBox: {
    width: 40,
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  digit: {
    fontSize: 24,
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    height: 0,
    width: 0,
  },
  cancelButton: {
    marginTop: 15,
    padding: 10,
  },
  cancelButtonText: {
    color: '#007AFF',
    fontSize: 16,
  },
  submitButton: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  }
});