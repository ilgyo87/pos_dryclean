import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 10,
    width: '100%',
  },
  inputContainer: {
    width: '100%',
  },
  input: {
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  resultsContainer: {
    position: 'absolute',
    top: 55,
    left: 0,
    right: 0,
    maxHeight: 250,
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    zIndex: 999,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  resultItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  resultText: {
    fontSize: 16,
  },
  highlightText: {
    backgroundColor: '#f0f0f0',
    fontWeight: '600',
  },
  noResults: {
    padding: 15,
    alignItems: 'center',
  },
  noResultsText: {
    color: '#666',
  },
  clearButton: {
    position: 'absolute',
    right: 15,
    top: 12,
    padding: 5,
    zIndex: 2,
  },
  clearIcon: {
    fontSize: 18,
    color: '#888',
    fontWeight: 'bold',
  },
  highlightMatch: {
    fontWeight: 'bold',
    backgroundColor: 'rgba(255, 230, 0, 0.2)',
  }
});