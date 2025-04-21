import React from 'react';
import { View, Text, TouchableOpacity, FlatList, ListRenderItem } from 'react-native';
import { PredictiveSearchResultsProps } from './types';
import { styles } from './styles';

/**
 * Component to display search results
 */
const PredictiveSearchResults = <T extends Record<string, any>>({
  data,
  onSelect,
  customRenderItem,
  containerStyle,
}: PredictiveSearchResultsProps<T>) => {
  // Default renderer for items if no custom renderer provided
  const defaultRenderItem = ({ item }: { item: T }) => {
    const displayName = item.name || item.title || item.label ||
      item.businessName || item.firstName ||
      JSON.stringify(item);

    return (
      <TouchableOpacity
        style={styles.resultItem}
        onPress={() => onSelect(item)}
      >
        <Text style={styles.resultText}>{displayName}</Text>
      </TouchableOpacity>
    );
  };

  const renderListItem: ListRenderItem<T> = ({ item }) => {
    if (customRenderItem) {
      return customRenderItem(item, () => onSelect(item)) as React.ReactElement;
    }
    return defaultRenderItem({ item });
  };

  return (
    <View style={[styles.resultsContainer, containerStyle]}>
      <FlatList
        data={data}
        renderItem={renderListItem}
        keyExtractor={(item, index) => {
          // Try to use id or _id if available, fall back to index
          if (item.id) return String(item.id);
          if (item._id) return String(item._id);
          return `result-${index}`;
        }}
        keyboardShouldPersistTaps="handled"
        maxToRenderPerBatch={10}
        windowSize={5}
        initialNumToRender={10}
        showsVerticalScrollIndicator={true}
        ListEmptyComponent={
          <View style={styles.noResults}>
            <Text style={styles.noResultsText}>No results found</Text>
          </View>
        }
      />
    </View>
  );
};

export default PredictiveSearchResults;