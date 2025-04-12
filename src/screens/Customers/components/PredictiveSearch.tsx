import React, { useState, useRef, useEffect } from 'react';
import { View, TextInput, FlatList, Text, StyleSheet, TouchableOpacity, Keyboard, TouchableWithoutFeedback, Dimensions } from 'react-native';
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
    const searchContainerRef = useRef<View>(null);

    const handleOutsideTouch = () => {
        if (showSuggestions) {
            setShowSuggestions(false);
        }
    };

    // Filter customers based on query
    useEffect(() => {
        if (!query.trim()) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        const normalizedQuery = query.toLowerCase().trim();

        if (!normalizedQuery) {
          setSuggestions([]);
          setShowSuggestions(false);
          return;
      }

      const filtered = customers
      .filter(customer => {
          const fullName = `${customer.firstName} ${customer.lastName}`.toLowerCase();
          
          // Check if query appears in full name or individual fields
          return (
              fullName.includes(normalizedQuery) ||
              customer.firstName.toLowerCase().includes(normalizedQuery) ||
              customer.lastName.toLowerCase().includes(normalizedQuery) ||
              customer.phoneNumber?.includes(normalizedQuery) ||
              customer.email?.toLowerCase().includes(normalizedQuery)
          );
      })
      .slice(0, 8); // Limit to 8 suggestions

        setSuggestions(filtered);
        setShowSuggestions(filtered.length > 0);
        setSelectedIndex(-1);
    }, [query, customers]);

    // Handle keyboard navigation
    const handleKeyPress = (e: any) => {
        if (!showSuggestions || suggestions.length === 0) return;

        const key = e.nativeEvent.key;

        if (key === 'ArrowDown' || key === 'Down') {
            e.preventDefault?.();
            setSelectedIndex(prev =>
                prev < suggestions.length - 1 ? prev + 1 : prev
            );
        } else if (key === 'ArrowUp' || key === 'Up') {
            e.preventDefault?.();
            setSelectedIndex(prev => (prev > 0 ? prev - 1 : 0));
        } else if (key === 'Enter' || key === 'Return') {
            e.preventDefault?.();

            if (selectedIndex === -1 && suggestions.length > 0) {
                handleSelectCustomer(suggestions[0]);
            } else if (selectedIndex >= 0) {
                handleSelectCustomer(suggestions[selectedIndex]);
            }
        }
    };

    const handleSelectCustomer = (customer: Customer) => {
        onCustomerSelect(customer);
        setQuery('');
        setSuggestions([]);
        setShowSuggestions(false);
        Keyboard.dismiss();
    };

    const clearSearch = () => {
        setQuery('');
        setSuggestions([]);
        setShowSuggestions(false);
    };

    const highlightText = (text: string, query: string) => {
      if (!query.trim()) return <Text>{text}</Text>;
  
      // Use a regex that captures the query as a group
      const regex = new RegExp(`(${query.trim()})`, 'gi');
      
      // Split the text while preserving the matches
      const parts = text.split(regex);
  
      return (
          <Text>
              {parts.map((part, i) => {
                  // Check if this part matches the query (case insensitive)
                  if (part.toLowerCase() === query.trim().toLowerCase()) {
                      return <Text key={i} style={styles.highlight}>{part}</Text>;
                  } else {
                      return <Text key={i}>{part}</Text>;
                  }
              })}
          </Text>
      );
  };

    return (
        <TouchableWithoutFeedback onPress={handleOutsideTouch}>
            <View style={styles.container} ref={searchContainerRef}>
                <View style={styles.searchContainer}>
                    <TextInput
                        ref={inputRef}
                        style={styles.searchInput}
                        placeholder={placeholder}
                        value={query}
                        onChangeText={setQuery}
                        onFocus={() => query.trim() && setSuggestions(suggestions)}
                        onKeyPress={handleKeyPress}
                    />
                    {query ? (
                        <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
                            <Ionicons name="close-circle" size={20} color="#888" />
                        </TouchableOpacity>
                    ) : (
                        <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
                    )}
                </View>

                {showSuggestions && (
                    <>
                        <TouchableWithoutFeedback onPress={handleOutsideTouch}>
                            <View style={styles.backdrop} />
                        </TouchableWithoutFeedback>
                        
                        <View style={styles.suggestionsContainer}>
                            <FlatList
                                data={suggestions}
                                keyExtractor={(item) => item.id}
                                keyboardShouldPersistTaps="always"
                                renderItem={({ item, index }) => (
                                    <TouchableOpacity
                                        style={[
                                            styles.suggestionItem,
                                            index === selectedIndex && styles.selectedSuggestion
                                        ]}
                                        onPress={() => handleSelectCustomer(item)}
                                        activeOpacity={0.7}
                                    >
                                        <View>
                                            <Text style={styles.customerName}>
                                                {highlightText(`${item.firstName} ${item.lastName}`, query)}
                                            </Text>
                                            {item.phoneNumber && (
                                                <Text style={styles.customerDetail}>
                                                    {highlightText(item.phoneNumber, query)}
                                                </Text>
                                            )}
                                            {item.email && (
                                                <Text style={styles.customerDetail}>
                                                    {highlightText(item.email, query)}
                                                </Text>
                                            )}
                                        </View>
                                    </TouchableOpacity>
                                )}
                            />
                        </View>
                    </>
                )}
            </View>
        </TouchableWithoutFeedback>
    );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
    container: {
        position: 'relative',
        width: '100%',
        zIndex: 100,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
        paddingHorizontal: 12,
        marginVertical: 10,
    },
    searchInput: {
        flex: 1,
        height: 45,
        fontSize: 16,
        color: '#333',
    },
    searchIcon: {
        marginLeft: 8,
    },
    clearButton: {
        padding: 5,
    },
    backdrop: {
        position: 'absolute',
        top: 55,
        left: 0,
        right: 0,
        bottom: -1000,
        backgroundColor: 'rgba(0,0,0,0.3)',
        zIndex: 10,
    },
    suggestionsContainer: {
        position: 'absolute',
        top: 55,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        borderRadius: 8,
        maxHeight: 300,
        zIndex: 20,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    suggestionItem: {
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    selectedSuggestion: {
        backgroundColor: '#f5f5f5',
    },
    customerName: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
    },
    customerDetail: {
        fontSize: 14,
        color: '#666',
        marginTop: 2,
    },
    highlight: {
        backgroundColor: 'rgba(255,230,0,0.4)',
        fontWeight: '600',
    },
});