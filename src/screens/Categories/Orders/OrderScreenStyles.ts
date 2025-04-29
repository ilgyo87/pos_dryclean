import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f9fa',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 12,
    maxHeight: '80%',
  },
  modalScroll: {
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  orderDetailRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  orderDetailLabel: {
    width: 80,
    fontWeight: '600',
    color: '#555',
  },
  orderDetailValue: {
    flex: 1,
    color: '#333',
  },
  statusText: {
    fontWeight: '600',
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },


  notesSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  noteItem: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  noteIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  noteText: {
    flex: 1,
    fontSize: 14,
    color: '#555',
  },
  ticketButton: {
    backgroundColor: '#E1F5FE',
    borderColor: '#03A9F4',
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginVertical: 4,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  ticketButtonText: {
    color: '#0277BD',
    fontWeight: '500',
    marginLeft: 4,
  },
  modalOverlayFull: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#fff',
    zIndex: 100,
  },
});
