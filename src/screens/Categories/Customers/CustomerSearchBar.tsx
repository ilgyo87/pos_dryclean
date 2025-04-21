// src/components/Customers/CustomerSearchBar.tsx
import React from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

interface CustomerSearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onClear: () => void;
}

const CustomerSearchBar: React.FC<CustomerSearchBarProps> = ({ 
  value, 
  onChangeText, 
  onClear 
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <MaterialIcons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.input}
          placeholder="Search customers..."
          value={value}
          onChangeText={onChangeText}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        {value.length > 0 && (
          <TouchableOpacity onPress={onClear} style={styles.clearButton}>
            <MaterialIcons name="clear" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    paddingHorizontal: 10,
  },
  searchIcon: {
    marginRight: 6,
  },
  input: {
    flex: 1,
    height: 40,
    fontSize: 16,
  },
  clearButton: {
    padding: 6,
  },
});

export default CustomerSearchBar;