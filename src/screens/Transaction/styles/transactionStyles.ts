import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e4e8',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#d1d5da',
    borderRadius: 4,
    paddingHorizontal: 12,
    backgroundColor: '#ffffff',
    marginRight: 8,
  },
  searchButton: {
    height: 40,
    paddingHorizontal: 16,
    backgroundColor: '#0366d6',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
  },
  newCustomerButton: {
    height: 40,
    paddingHorizontal: 16,
    backgroundColor: '#28a745',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  customersContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  customerItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e4e8',
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#24292e',
    marginBottom: 4,
  },
  customerDetails: {
    fontSize: 14,
    color: '#586069',
    marginBottom: 2,
  },
  customerAddress: {
    fontSize: 13,
    color: '#6a737d',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6a737d',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityIndicator: {
    marginBottom: 12,
  },
  loadingText: {
    fontSize: 16,
    color: '#6a737d',
  },
  errorContainer: {
    padding: 16,
    backgroundColor: '#ffdce0',
    borderRadius: 4,
    marginBottom: 16,
  },
  errorText: {
    color: '#cb2431',
    fontSize: 14,
  }
});