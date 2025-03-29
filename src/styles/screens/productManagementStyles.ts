import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  // Main container
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  contentContainer: {
    flex: 1,
    padding: 16,
    paddingTop: 8,
  },
  
  // Header section
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  buttonContainer: {
    flexDirection: 'row',
  },
  addButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  serviceButton: {
    backgroundColor: '#8a68c5',
  },
  productButton: {
    backgroundColor: '#4CAF50',
  },
  addButtonText: {
    color: 'white',
    fontWeight: '500',
    marginLeft: 4,
    fontSize: 13,
  },
  
  // Service tabs - Extreme space reduction
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 0,
    height: 24,
  },
  tab: {
    paddingVertical: 2,
    paddingHorizontal: 10,
    marginRight: 6,
    borderRadius: 4,
    backgroundColor: 'white',
    height: 24,
    justifyContent: 'center',
  },
  activeTab: {
    backgroundColor: '#f0f0f0',
  },
  tabText: {
    fontSize: 12,
    color: '#666',
  },
  activeTabText: {
    color: '#007aff',
    fontWeight: 'bold',
  },
  
  // Tab underline - Essentially removed
  tabUnderlineContainer: {
    flexDirection: 'row',
    height: 1,
    marginBottom: 1,
  },
  activeUnderline: {
    width: 80,
    height: 1,
    backgroundColor: '#007aff',
  },
  inactiveUnderline: {
    flex: 1,
    height: 1,
    backgroundColor: '#eee',
  },
  
  // Service info section - Maximally compact
  serviceInfoContainer: {
    backgroundColor: 'white',
    padding: 6,
    borderRadius: 8,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#eee',
  },
  serviceTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  serviceDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  servicePriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  servicePrice: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  editServiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 3,
    paddingHorizontal: 6,
    backgroundColor: '#f8f8f8',
    borderRadius: 4,
  },
  editServiceText: {
    marginLeft: 2,
    color: '#666',
    fontSize: 10,
  },
  
  // Products header - Minimal spacing
  productsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 0, // Reduced from 4
  },
  productsHeaderTitle: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  productsCountText: {
    fontSize: 12,
    color: '#666',
  },
  productItem: {
    width: '23%',
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 0, // Reduced from 4
    padding: 8,
    borderWidth: 1,
    borderColor: '#eee',
    marginHorizontal: '1%',
  },
  productImageContainer: {
    height: 80,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    marginBottom: 0, // Reduced from 4
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productImagePlaceholder: {
    fontSize: 11,
    color: '#999',
  },
  productName: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 0, // Reduced from 2
  },
  productDescription: {
    fontSize: 11,
    color: '#666',
    marginBottom: 0, // Reduced from 4
  },
  productPrice: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#007aff',
  },
  productActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 0, // Reduced from 4
    alignItems: 'center',
  },
  productEditButton: {
    width: 20,
    height: 20,
  },
  productEditIcon: {
    color: '#007aff',
  },
  productDeleteButton: {
    width: 20,
    height: 20,
    marginLeft: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#F44336',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productDeleteIcon: {
    color: '#F44336',
  },
  
  // Pagination controls
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 0, // Reduced from 4
    marginBottom: 0, // Reduced from 8
  },
  paginationButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  paginationButtonDisabled: {
    opacity: 0.5,
  },
  paginationText: {
    fontSize: 13,
    color: '#666',
    marginHorizontal: 12,
  },
  
  // Empty state
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
  },
  
  // Loading state
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 15,
    color: '#666',
    marginTop: 16,
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 20,
    width: '100%',
    maxWidth: 500,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 4,
    marginLeft: 10,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  cancelButtonText: {
    color: '#666',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
  },
  deleteButton: {
    backgroundColor: '#F44336',
    marginRight: 'auto',
  },
  actionButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  
  // Alert modal styles
  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  alertContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  alertMessage: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  alertButtonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  alertButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
    marginLeft: 10,
  },
  alertCancelButton: {
    backgroundColor: '#f0f0f0',
  },
  alertCancelText: {
    color: '#666',
  },
  alertConfirmButton: {
    backgroundColor: '#F44336',
  },
  alertConfirmText: {
    color: 'white',
    fontWeight: 'bold',
  },
});