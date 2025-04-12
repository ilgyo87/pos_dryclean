import React, { useState, useRef, useEffect } from 'react';
import { View, TextInput, FlatList, Text, StyleSheet, TouchableOpacity, Keyboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Schema } from '../../../../amplify/data/resource';

type Customer = Schema['Customer']['type'];

interface PredictiveSearchProps {
  customers: Customer[];
  onCustomerSelect: (customer: Customer) => void;
  placeholder?: string;
}

export default function PredictiveSearch({ 
  customers, 
  onCustomerSelect,
  placeholder = 'Search customers...'
}: PredictiveSearchProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Customer[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<TextInput>(null);
  
  // Filter customers based on query
  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    
    const normalizedQuery = query.toLowerCase().trim();
    const filtered = customers
      .filter(customer => 
        customer.firstName.toLowerCase().includes(normalizedQuery) ||
        customer.lastName.toLowerCase().includes(normalizedQuery) ||
        customer.phoneNumber?.includes(normalizedQuery) ||
        customer.email?.toLowerCase().includes(normalizedQuery)
      )
      .slice(0, 8); // Limit to 8 suggestions
    
    setSuggestions(filtered);
    setShowSuggestions(filtered.length > 0);
    setSelectedIndex(-1);
  }, [query, customers]);
  
  // Handle keyboard navigation
  const handleKeyPress = (e: any) => {
    if (!showSuggestions) return;
    
    if (e.nativeEvent.key === 'ArrowDown') {
      setSelectedIndex(prev => 
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.nativeEvent.key === 'ArrowUp') {
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : 0));
    } else if (e.nativeEvent.key === 'Enter') {
      // If nothing is selected but we have suggestions, select the first one
      if (selectedIndex === -1 && suggestions.length > 0) {
        handleSelectCustomer(suggestions[0]);
      } 
      // Otherwise select the highlighted item
      else if (selectedIndex >= 0) {
        handleSelectCustomer(suggestions[selectedIndex]);
      }
    }
  };
  
  const handleSelectCustomer = (customer: Customer) => {
    onCustomerSelect(customer);
    setQuery('');
    setShowSuggestions(false);
    Keyboard.dismiss();
  };
  
  const clearSearch = () => {
    setQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
  };
  
  // Highlight matching text in suggestions
  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return <Text>{text}</Text>;
    
    const regex = new RegExp(`(${query.trim()})`, 'gi');
    const parts = text.split(regex);
    
    return (
      <Text>
        {parts.map((part, i) => 
          regex.test(part) ? 
            <Text key={i} style={styles.highlight}>{part}</Text> : 
            <Text key={i}>{part}</Text>
        )}
      </Text>
    );
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          ref={inputRef}
          style={styles.input}
          placeholder={placeholder}
          value={query}
          onChangeText={setQuery}
          onFocus={() => query.trim() && setShowSuggestions(true)}
          onKeyPress={handleKeyPress}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
            <Ionicons name="close-circle" size={18} color="#888" />
          </TouchableOpacity>
        )}
      </View>
      
      {showSuggestions && (
        <View style={styles.suggestionsContainer}>
          <FlatList
            data={suggestions}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="always"
            renderItem={({ item, index }) => (
              <TouchableOpacity 
                style={[
                  styles.suggestionItem,
                  index === selectedIndex && styles.selectedItem
                ]}
                onPress={() => handleSelectCustomer(item)}
              >
                <View style={styles.avatar}>
                  <Ionicons name="person" size={20} color="#fff" />
                </View>
                <View style={styles.suggestionContent}>
                  <Text style={styles.suggestionName}>
                    {highlightText(`${item.firstName} ${item.lastName}`, query)}
                  </Text>
                  {item.phoneNumber && (
                    <Text style={styles.suggestionDetail}>
                      {highlightText(item.phoneNumber, query)}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    position: 'relative',
    zIndex: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchIcon: {
    marginRight: 6,
  },
  input: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    padding: 5,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: 45,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderRadius: 8,
    maxHeight: 300,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 20,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedItem: {
    backgroundColor: '#f0f7ff',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4285F4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionName: {
    fontSize: 16,
    color: '#333',
    marginBottom: 2,
  },
  suggestionDetail: {
    fontSize: 14,
    color: '#666',
  },
  highlight: {
    backgroundColor: '#ffe066',
    fontWeight: '500',
  },
});