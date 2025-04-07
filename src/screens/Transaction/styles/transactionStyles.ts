import { StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const styles = StyleSheet.create({
  // Main container
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  
  // Loading state
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  
  // Header styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  backButtonText: {
    fontSize: 16,
    color: '#0066cc',
  },
  headerRight: {
    width: 60, // Balance with back button
  },
  
  // Customer info section
  customerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#e6f2ff',
    borderBottomWidth: 1,
    borderBottomColor: '#cce0ff',
  },
  customerName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  notesButton: {
    backgroundColor: '#0066cc',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  notesButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  
  // Main content container with columns
  mainContentContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  leftColumn: {
    flex: 3,
    borderRightWidth: 1,
    borderRightColor: '#e1e1e1',
  },
  rightColumn: {
    flex: 2,
    backgroundColor: '#f8f8f8',
  },
  
  // Category tabs
  tabsContainer: {
    maxHeight: 50,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  tabsContent: {
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  tabItem: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    marginHorizontal: 5,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  tabItemActive: {
    backgroundColor: '#0066cc',
  },
  tabText: {
    fontSize: 14,
    color: '#333',
  },
  tabTextActive: {
    color: '#fff',
    fontWeight: '500',
  },
  
  // Service content area
  serviceContentScroll: {
    flex: 1,
  },
  serviceContainer: {
    padding: 15,
    backgroundColor: '#fff',
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  serviceDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 15,
  },
  
  // Products section
  productsHeader: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  productItem: {
    width: '48%',
    marginBottom: 15,
    marginHorizontal: '1%',
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e1e1e1',
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  productImage: {
    width: '100%',
    height: 100,
    backgroundColor: '#f0f0f0',
  },
  productInfo: {
    padding: 10,
  },
  productName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 5,
    color: '#333',
  },
  productPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  noProductsText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 20,
  },
  
  // Cart section
  cartContainer: {
    flex: 1,
    padding: 15,
  },
  cartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  cartList: {
    flex: 1,
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e1e1e1',
  },
  cartItemImage: {
    width: 50,
    height: 50,
    borderRadius: 4,
    marginRight: 10,
    backgroundColor: '#f0f0f0',
  },
  cartItemInfo: {
    flex: 1,
  },
  cartItemName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  cartItemPrice: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
  },
  
  // Quantity controls
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 30,
    height: 30,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 15,
  },
  quantityButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '500',
    marginHorizontal: 10,
    minWidth: 20,
    textAlign: 'center',
  },
  
  // Summary section
  summaryContainer: {
    padding: 15,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e1e1e1',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e1e1e1',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  
  // Calendar section
  calendarSection: {
    padding: 15,
    backgroundColor: '#fff',
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e1e1e1',
  },
  calendarHeader: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#e1e1e1',
  },
  dateText: {
    fontSize: 14,
    color: '#333',
  },
  
  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarModal: {
    width: width * 0.9,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  calendarModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
    textAlign: 'center',
  },
  calendarButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  calendarButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    backgroundColor: '#0066cc',
  },
  calendarButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  calendarCancelButton: {
    backgroundColor: '#f44336',
  },
  
  // Notes modal
  notesModal: {
    width: width * 0.9,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  notesInput: {
    height: 120,
    borderWidth: 1,
    borderColor: '#e1e1e1',
    borderRadius: 5,
    padding: 10,
    marginVertical: 15,
    fontSize: 14,
    textAlignVertical: 'top',
  },
  
  // Checkout button
  checkoutButtonContainer: {
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#e1e1e1',
    backgroundColor: '#fff',
  },
  checkoutButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 5,
    alignItems: 'center',
  },
  checkoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  // Empty cart message
  emptyCartContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyCartText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
  }
});