import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    maxWidth: 320, // Shrink horizontally
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: 10, // Add horizontal padding
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  listContent: {
    flexGrow: 1,
  },
  itemContainer: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemLeft: {
    flex: 1,
    justifyContent: 'center',
    minWidth: 0,
  },
  itemName: {
    fontSize: 17,
    fontWeight: '500',
    flexShrink: 1,
    flexWrap: 'wrap',
    color: '#222',
    marginBottom: 5,
  },
  itemRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: '100%',
    gap: 8,
  },
  quantityLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007bff',
    textAlign: 'left',
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007bff',
    textAlign: 'right',
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    padding: 4,
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantity: {
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 10,
    minWidth: 20,
    textAlign: 'center',
  },
  optionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
  },
  optionsEllipsis: {
    fontSize: 24,
    color: '#666',
    fontWeight: 'bold',
    lineHeight: 14,
    paddingBottom: 2,
  },
  optionsContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  optionsContainerAligned: {
    alignItems: 'flex-end',
    marginRight: 0,
  },
  optionText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007bff',
  },
  checkoutButton: {
    backgroundColor: '#007bff',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkoutButtonDisabled: {
    backgroundColor: '#ccc',
  },
  checkoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  modalItemName: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  optionSection: {
    marginBottom: 16,
  },
  optionSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  starchOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  starchOption: {
    flex: 1,
    padding: 8,
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    marginHorizontal: 4,
  },
  selectedStarchOption: {
    backgroundColor: '#e6f0ff',
    borderColor: '#007bff',
    borderWidth: 1,
  },
  starchOptionText: {
    fontSize: 12,
    color: '#666',
  },
  selectedStarchOptionText: {
    color: '#007bff',
    fontWeight: '600',
  },
  pressOnlyOption: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ccc',
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pressOnlyText: {
    fontSize: 14,
    color: '#333',
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 8,
    height: 80,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  cancelButton: {
    padding: 10,
    marginRight: 10,
  },
  cancelButtonText: {
    color: '#666',
  },
  saveButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 4,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
export default styles;
