// src/styles/components/createBusinessStyles.ts
import { StyleSheet, Dimensions } from 'react-native';

const { height } = Dimensions.get('window');

export const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.6)', // Semi-transparent background
      },
      modalContent: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 25,
        width: '90%', // Responsive width
        maxWidth: 500, // Max width for larger screens/tablets
        maxHeight: height * 0.85, // Limit height
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
      },
      modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
        color: '#333',
      },
      scrollView: {
        // If you need specific styling for the scrollview itself
      },
      inputGroup: {
        marginBottom: 15,
      },
      inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#555',
        marginBottom: 6,
      },
      input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 6,
        paddingVertical: 10,
        paddingHorizontal: 12,
        fontSize: 16,
        backgroundColor: '#f9f9f9',
      },
      inputError: {
        borderColor: '#dc3545', // Red border for errors
        backgroundColor: '#ffe3e6',
      },
      errorMessage: {
        color: '#dc3545',
        fontSize: 12,
        marginTop: 4,
      },
      successMessage: {
        color: '#28a745', // Green for success
        fontSize: 12,
        marginTop: 4,
      },
      warningMessage: {
        color: '#ffc107', // Yellow/Orange for warnings
        fontSize: 12,
        marginTop: 4,
      },
      phoneCheckIndicator: {
        position: 'absolute',
        right: 10,
        top: 38, // Adjust based on input height/label
      },
      buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between', // Space out buttons
        marginTop: 25,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        paddingTop: 15,
      },
      button: {
        borderRadius: 6,
        paddingVertical: 12,
        paddingHorizontal: 20, // Give buttons some width
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 100, // Ensure minimum width
      },
      buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
      },
      createButton: {
        backgroundColor: '#007bff', // Primary blue
        flex: 1.5, // Make create button slightly larger
        marginHorizontal: 5,
      },
      cancelButton: {
        backgroundColor: '#6c757d', // Gray
        flex: 1,
        marginRight: 5,
      },
      clearButton: {
        backgroundColor: '#ffc107', // Amber/Yellow
        flex: 1,
        marginHorizontal: 5,
      },
      disabledButton: {
        backgroundColor: '#adb5bd', // Lighter gray when disabled
        opacity: 0.7,
      },
      loadingContainer: {
        ...StyleSheet.absoluteFillObject, // Cover the modal content
        backgroundColor: 'rgba(255, 255, 255, 0.8)', // Semi-transparent white overlay
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 10, // Match modal content border radius
      },
      // Styles for the QR Code Scanner Modal/View
      qrModalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.7)', // Darker overlay for focus
      },
});