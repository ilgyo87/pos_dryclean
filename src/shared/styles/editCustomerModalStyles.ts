import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 10,
    maxHeight: '90%',
    width: '90%',
    alignSelf: 'center',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    padding: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 18,
    color: '#666',
  },
  formScrollView: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 8,
    color: '#666',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  multilineInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  rowInputContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 16,
  },
  button: {
    padding: 14,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    flex: 2,
    marginLeft: 8,
  },
  deleteButton: {
    backgroundColor: '#F44336',
    flex: 1,
  },
  cancelButton: {
    backgroundColor: '#757575',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  qrCodeContainer: {
    marginBottom: 16,
  },
  qrCodeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  qrCodeWrapper: {
    padding: 10,
    backgroundColor: 'white',
    alignSelf: 'center',
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    height: 170,
    width: 170,
    alignItems: 'center',
    justifyContent: 'center',
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
    width: 150,
    height: 150,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  emptyQrText: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
  },
  // Additional styles for QR capture view
  qrCaptureContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  qrCaptureTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  qrCaptureInstructions: {
    textAlign: 'center',
    marginTop: 10,
    color: '#555',
    marginBottom: 20,
  },
  qrCaptureButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 20,
  },
  qrCaptureButton: {
    backgroundColor: '#4f46e5',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 5,
    minWidth: 120,
    alignItems: 'center',
  },
  qrCaptureButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  qrCaptureSkipButton: {
    backgroundColor: '#757575',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 5,
    minWidth: 120,
    alignItems: 'center',
  },
  qrCaptureSkipButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  disabledButton: {
    opacity: 0.5,
  },
});
