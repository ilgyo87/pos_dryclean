import React from 'react';
import { View, TextInput, TouchableOpacity, Text } from 'react-native';
import { PredictiveSearchBarProps } from './types';
import { styles } from './styles';

/**
 * Search bar component with clear button
 */
const PredictiveSearchBar: React.FC<PredictiveSearchBarProps> = ({
  value,
  onChangeText,
  onFocus,
  onBlur,
  placeholder = "Search...",
  inputStyle,
  ...restProps
}) => {
  const handleClear = () => {
    onChangeText('');
  };

  return (
    <View style={styles.inputContainer}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onFocus={onFocus}
        onBlur={onBlur}
        placeholder={placeholder}
        style={[styles.input, inputStyle]}
        clearButtonMode="never" // We'll implement our own clear button
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        {...restProps}
      />
      
      {value !== '' && (
        <TouchableOpacity 
          style={styles.clearButton} 
          onPress={handleClear}
          accessibilityLabel="Clear search"
        >
          <Text style={styles.clearIcon}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default PredictiveSearchBar;