// src/screens/Checkout/CheckoutScreen.styles.ts
import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
  },
  leftPanel: {
    flex: 3.5, // Increased from 3 to 3.5 to make the product grid larger
    padding: 10,
    display: 'flex',
    flexDirection: 'column',
  },
  productSection: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  dateSelectionContainer: {
    padding: 10,
    marginTop: 5,
    marginBottom: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  rightPanel: {
    flex: 1.2, // Make the order summary more narrow in horizontal layout
    maxWidth: 320, // Prevent it from getting too wide
    borderLeftWidth: 1,
    borderLeftColor: '#e0e0e0',
    backgroundColor: '#fff',
    padding: 1,
  },
  // Alternative layout for smaller screens
  smallScreenContent: {
    flex: 1,
    flexDirection: 'column',
  },
  smallScreenLeftPanel: {
    flex: 2, // Give more space to product section on small screens
    padding: 10,
  },
  smallScreenRightPanel: {
    flex: 1, // Give more space to order summary on small screens
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#fff',
    padding: 10,
  },
  checkoutSection: {
    marginTop: 5,
  },
  dateButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  checkoutButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 10,
  },
  checkoutButtonDisabled: {
    backgroundColor: '#c8e6c9',
    opacity: 0.7,
  },
  checkoutButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 15,
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: '#f0f0f0',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '500',
  },
  // Loading state
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
});

export default styles;