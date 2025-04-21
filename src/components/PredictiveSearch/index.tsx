import React from 'react';
import { View } from 'react-native';
import PredictiveSearchBar from './PredictiveSearchBar';
import PredictiveSearchResults from './PredictiveSearchResults';
import { usePredictiveSearch } from './usePredictiveSearch';
import { PredictiveSearchProps } from './types';
import { styles } from './styles';

/**
 * PredictiveSearch component that combines the search bar and results list
 * @param items - Array of items to search through
 * @param onSelect - Function called when an item is selected
 * @param renderItem - Optional custom render function for list items
 * @param searchKeys - Array of keys to search within each item (default: ['name'])
 * @param placeholder - Placeholder text for search input
 * @param debounceTime - Time in ms to debounce search input (default: 300)
 * @param maxResults - Maximum number of results to show (default: 20)
 * @param containerStyle - Optional custom style for container
 * @param inputStyle - Optional custom style for input
 * @param resultsContainerStyle - Optional custom style for results container
 */
const PredictiveSearch = <T extends Record<string, any>>({
  items,
  onSelect,
  renderItem,
  searchKeys = ['name'],
  placeholder = "Search...",
  debounceTime = 300,
  maxResults = 20,
  containerStyle,
  inputStyle,
  resultsContainerStyle,
  onChangeText,
}: PredictiveSearchProps<T>) => {
  const {
    query,
    filteredItems,
    showResults,
    handleChangeText,
    handleFocus,
    handleBlur,
    handleSelect,
  } = usePredictiveSearch<T>({
    items,
    onSelect,
    searchKeys,
    debounceTime,
    maxResults,
  });

  return (
    <View style={[styles.container, containerStyle]}>
      <PredictiveSearchBar
        value={query}
        onChangeText={(text) => {
          handleChangeText(text);
          if (typeof onChangeText === 'function') {
            onChangeText(text);
          }
        }}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        inputStyle={inputStyle}
      />

      {showResults && filteredItems.length > 0 && (
        <PredictiveSearchResults<T>
          data={filteredItems}
          onSelect={handleSelect}
          customRenderItem={renderItem}
          containerStyle={resultsContainerStyle}
        />
      )}
    </View>
  );
};

export default PredictiveSearch;
export * from './types';