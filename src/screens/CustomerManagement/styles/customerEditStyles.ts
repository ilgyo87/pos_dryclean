import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  header: {
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  quickSearchContainer: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  quickSearchInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 4,
    paddingHorizontal: 10,
    marginRight: 8,
  },
  scanButton: {
    backgroundColor: '#4f46e5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  quickAddContainer: {
    padding: 16,
    backgroundColor: '#e9f7ef',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  quickAddText: {
    fontSize: 16,
    marginBottom: 8,
  },
  quickAddButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickAddButton: {
    backgroundColor: '#28a745',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    flex: 1,
    alignItems: 'center',
  },
  listContainer: {
    flex: 1,
  },
  customerItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    alignItems: 'center',
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  customerDetail: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 2,
  },
  qrCodeContainer: {
    marginLeft: 16,
    justifyContent: 'center',
    alignItems: 'center',
    width: 50,
    height: 50,
    backgroundColor: 'white',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e9ecef',
    overflow: 'hidden',
  },
  newCustomerButton: {
    backgroundColor: '#4f46e5',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    marginBottom: 4,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 4,
    padding: 8,
    fontSize: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  saveButton: {
    backgroundColor: '#28a745',
    padding: 12,
    borderRadius: 4,
    flex: 1,
    alignItems: 'center',
    marginRight: 8,
  },
  deleteButton: {
    backgroundColor: '#dc3545',
    padding: 12,
    borderRadius: 4,
    flex: 1,
    alignItems: 'center',
  },
  closeButton: {
    backgroundColor: '#6c757d',
    padding: 12,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 8,
  },
  qrModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  qrModalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  qrModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  qrModalCustomerInfo: {
    marginBottom: 16,
    alignItems: 'center',
  },
  qrModalCloseButton: {
    backgroundColor: '#6c757d',
    padding: 12,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 16,
    width: '100%',
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyListText: {
    fontSize: 18,
    color: '#6c757d',
    textAlign: 'center',
  },
  // Additional styles for CustomerSearchScreen
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 4,
    paddingHorizontal: 10,
    marginRight: 8,
  },
  scanButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  selectButtonContainer: {
    backgroundColor: '#4f46e5',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
  },
  selectButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  addButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  searchTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  searchTypeButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
    backgroundColor: '#4f46e5',
  },
  searchTypeButtonActive: {
    backgroundColor: '#4f46e5',
  },
  searchTypeButtonInactive: {
    backgroundColor: '#e0e0e0',
  },
  searchTypeText: {
    fontWeight: '500',
    color: 'white',
  },
  searchTypeTextActive: {
    color: 'white',
  },
  searchTypeTextInactive: {
    color: '#333',
  },
  globalSearchContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  globalSearchTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  noResultsContainer: {
    alignItems: 'center',
    padding: 20,
  },
  noResultsText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  createCustomerButton: {
    backgroundColor: '#28a745',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  createCustomerButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  errorText: {
    color: '#dc3545',
    fontSize: 12,
    marginTop: 4,
  },
  // Additional styles for EditCustomerModal
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  cancelButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  deleteButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  closeButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  customerList: {
    flex: 1,
    width: '100%'
  },
  // New styles for QR code display in CustomerEditScreen
  qrCodeWrapper: {
    padding: 5,
    backgroundColor: 'white',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e9ecef',
    overflow: 'hidden',
  },
  qrCodeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recaptureButton: {
    backgroundColor: '#4f46e5',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 5,
  },
  recaptureButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  emptyQrPlaceholder: {
    width: 50,
    height: 50,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 5,
  },
  emptyQrText: {
    color: '#666',
    fontSize: 8,
    textAlign: 'center',
  },
});
