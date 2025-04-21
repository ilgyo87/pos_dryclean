import { StyleProp, TextInputProps, ViewStyle } from 'react-native';

export interface PredictiveSearchProps<T> {
  /** Array of items to search through */
  items: T[];
  /** Function called when an item is selected */
  onSelect: (item: T) => void;
  /** Optional custom render function for list items */
  renderItem?: (item: T, onPress: () => void) => React.ReactElement;
  /** Array of keys to search within each item */
  searchKeys?: (keyof T)[];
  /** Placeholder text for search input */
  placeholder?: string;
  /** Time in ms to debounce search input */
  debounceTime?: number;
  /** Maximum number of results to show */
  maxResults?: number;
  /** Optional callback for text changes (useful for highlighting) */
  onChangeText?: (text: string) => void;
  /** Optional custom style for container */
  containerStyle?: StyleProp<ViewStyle>;
  /** Optional custom style for input */
  inputStyle?: StyleProp<ViewStyle>;
  /** Optional custom style for results container */
  resultsContainerStyle?: StyleProp<ViewStyle>;
}

export interface PredictiveSearchBarProps extends Partial<TextInputProps> {
  /** Value of the search input */
  value: string;
  /** Function called when text changes */
  onChangeText: (text: string) => void;
  /** Function called when input is focused */
  onFocus?: () => void;
  /** Function called when input loses focus */
  onBlur?: () => void;
  /** Placeholder text for search input */
  placeholder?: string;
  /** Optional custom style for input */
  inputStyle?: StyleProp<ViewStyle>;
}

export interface PredictiveSearchResultsProps<T> {
  /** Array of filtered items to display */
  data: T[];
  /** Function called when an item is selected */
  onSelect: (item: T) => void;
  /** Optional custom render function for list items */
  customRenderItem?: (item: T, onPress: () => void) => React.ReactElement;
  /** Optional custom style for container */
  containerStyle?: StyleProp<ViewStyle>;
}

export interface UsePredictiveSearchProps<T> {
  /** Array of items to search through */
  items: T[];
  /** Function called when an item is selected */
  onSelect: (item: T) => void;
  /** Array of keys to search within each item */
  searchKeys?: (keyof T)[];
  /** Time in ms to debounce search input */
  debounceTime?: number;
  /** Maximum number of results to show */
  maxResults?: number;
}

export interface UsePredictiveSearchResult<T> {
  /** Current search query */
  query: string;
  /** Filtered items based on search query */
  filteredItems: T[];
  /** Whether to show search results */
  showResults: boolean;
  /** Function to handle text change */
  handleChangeText: (text: string) => void;
  /** Function to handle input focus */
  handleFocus: () => void;
  /** Function to handle input blur */
  handleBlur: () => void;
  /** Function to handle item selection */
  handleSelect: (item: T) => void;
}