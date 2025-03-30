import { StyleSheet, Dimensions } from 'react-native';

// Calculate item dimensions for square items in a 4x4 grid
const screenWidth = Dimensions.get('window').width;
const itemMargin = 8; // Total margin between items (4px on each side)
const itemWidth = (screenWidth - (5 * itemMargin)) / 4; // 4 items per row with margins

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  contentContainer: {
    flex: 1,
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  buttonContainer: {
    flexDirection: 'row',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginLeft: 8,
    borderWidth: 1,
  },
  serviceButton: {
    backgroundColor: '#e6f7ff',
    borderColor: '#1890ff',
  },
  productButton: {
    backgroundColor: '#f6ffed',
    borderColor: '#52c41a',
  },
  addButtonText: {
    marginLeft: 4,
    fontSize: 14,
  },

  // Service tabs
  tabsContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  tab: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    marginRight: 8,
    borderRadius: 4,
    backgroundColor: '#f0f0f0',
  },
  activeTab: {
    backgroundColor: '#1890ff',
  },
  tabText: {
    fontSize: 14,
    color: '#333',
  },
  activeTabText: {
    color: 'white',
  },

  // Product grid styles
  productGrid: {
    flex: 1,
  },

  // Square product item (GRID VIEW)
  productItem: {
    width: itemWidth,
    height: itemWidth, // Make it square
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 4,
    borderWidth: 1,
    borderColor: '#eee',
    margin: 4,
  },

  // Image container that takes more space (GRID VIEW)
  productImageContainer: {
    height: itemWidth * 0.6, // 60% of the square for the image
    borderRadius: 4,
    marginBottom: 2,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },

  // Image to fill the space completely
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover', // This makes the image cover the entire container
  },

  productImagePlaceholder: {
    fontSize: 11,
    color: '#999',
    textAlign: 'center',
  },

  productInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },

  productName: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 2,
  },

  productPrice: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: 'bold',
  },

  productActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },

  actionButton: {
    padding: 2,
    borderRadius: 4,
  },

  actionIcon: {
    fontSize: 12,
    color: '#666',
  },

  // Pagination styles
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
  },

  paginationButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },

  paginationButtonDisabled: {
    opacity: 0.5,
  },

  paginationText: {
    fontSize: 12,
    color: '#666',
    marginHorizontal: 12,
  },

  // Alert modal styles
  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  alertContainer: {
    width: 320,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },

  alertTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },

  alertMessage: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },

  alertButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  alertButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
    alignItems: 'center',
    marginHorizontal: 6,
  },

  alertCancelButton: {
    backgroundColor: '#f0f0f0',
  },

  alertConfirmButton: {
    backgroundColor: '#ff4d4f',
  },

  alertCancelText: {
    color: '#666',
    fontWeight: '500',
  },

  alertConfirmText: {
    color: 'white',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },

  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: 12,
  },
  formLabel: {
    fontSize: 14,
    marginBottom: 4,
    fontWeight: '500',
    color: '#333',
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    backgroundColor: 'white',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 4,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  saveButton: {
    backgroundColor: '#1890ff',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '500',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  
  // List view styles (renamed to avoid duplicates)
  listItemContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  listImageContainer: {
    width: 48,
    height: 48,
    borderRadius: 4,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  listImagePlaceholder: {
    fontSize: 10,
    color: '#aaa',
    textAlign: 'center',
  },
  listItemName: {
    flex: 2,
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  listItemDescription: {
    flex: 3,
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
  listItemPrice: {
    flex: 1,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'right',
    marginRight: 8,
  },
  listItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listEditButton: {
    padding: 6,
  },
  listDeleteButton: {
    padding: 6,
    marginLeft: 4,
  },
  listEditIcon: {
    fontSize: 16,
  },
  listDeleteIcon: {
    fontSize: 16,
  },
});