import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  // Main container
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  
  // Quick search section
  quickSearchContainer: {
    padding: 16,
    backgroundColor: '#f0f0f0',
  },
  quickSearchTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  quickSearchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quickSearchInput: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    paddingHorizontal: 12,
    backgroundColor: 'white',
    fontSize: 16,
    marginRight: 8,
  },
  scanButton: {
    height: 44,
    paddingHorizontal: 16,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
  },
  scanButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  searchingIndicator: {
    position: 'absolute',
    right: 12,
  },
  
  // Quick add customer section
  quickAddContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  foundProfileText: {
    fontSize: 14,
    color: '#666',
  },
  foundProfileName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 4,
  },
  foundProfileDetails: {
    fontSize: 14,
    color: '#333',
    marginTop: 2,
  },
  quickActionButtons: {
    flexDirection: 'row',
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 18,
  },
  importButton: {
    backgroundColor: '#4caf50',
    marginRight: 8,
  },
  editButton: {
    backgroundColor: '#ff9800',
  },
  newCustomerQuickButton: {
    backgroundColor: '#2196F3',
    marginTop: 8,
  },
  actionButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  noMatchText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  
  // Divider
  divider: {
    height: 1,
    backgroundColor: '#ddd',
  },
  
  // Header with search
  header: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    paddingHorizontal: 12,
    backgroundColor: 'white',
    marginRight: 8,
  },
  searchButton: {
    height: 44,
    paddingHorizontal: 16,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
  },
  newCustomerButton: {
    height: 44,
    paddingHorizontal: 16,
    backgroundColor: '#4caf50',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  
  // Customers list
  customersContainer: {
    flex: 1,
    padding: 16,
  },
  customerItem: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  customerItemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  customerInfoContainer: {
    flex: 1,
  },
  customerName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  globalBadge: {
    fontSize: 14,
    color: '#2196F3',
  },
  customerDetails: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  customerAddress: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  
  // QR Code related
  qrCodeContainer: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  qrCodeImage: {
    width: 60,
    height: 60,
    borderRadius: 4,
  },
  qrGeneratingContainer: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  qrPlaceholder: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginLeft: 8,
  },
  qrPlaceholderText: {
    color: '#999',
    fontWeight: 'bold',
    fontSize: 12,
  },
  
  // Customer actions
  customerActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 10,
  },
  customerAction: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginLeft: 8,
  },
  deleteAction: {
    backgroundColor: '#ffebee',
  },
  actionText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '500',
  },
  deleteActionText: {
    color: '#d32f2f',
    fontSize: 14,
    fontWeight: '500',
  },
  
  // Empty state and loading
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
});