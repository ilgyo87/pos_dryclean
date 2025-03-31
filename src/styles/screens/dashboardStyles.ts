// src/styles/screens/dashboardStyles.ts
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    container: {
      flex: 1, // Ensure container takes full height
      backgroundColor: '#f8f9fa',
      paddingHorizontal: 15, // Add horizontal padding to container
      paddingTop: 20, // Add top padding
    },
    title: {
      fontSize: 26,
      fontWeight: 'bold',
      color: '#333',
      marginBottom: 15,
      textAlign: 'center',
    },
    qrCodeContainer: {
      alignItems: 'center',
      marginBottom: 20,
      padding: 15,
      backgroundColor: '#ffffff',
      borderRadius: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    qrCodeLabel: {
      fontSize: 14,
      color: '#555',
      marginBottom: 8,
    },
    qrCodeImage: {
      width: 120,
      height: 120,
    },
    noQrCodeText: {
      fontSize: 14,
      color: '#888',
      textAlign: 'center',
      marginBottom: 20,
      fontStyle: 'italic',
    },
    row: {
        justifyContent: 'space-between', // Distribute items evenly in the row
        marginBottom: 15, // Add space between rows
    },
    menuItem: {
      width: '48%', // Almost half width for 2 columns, allows for spacing
      backgroundColor: '#fff',
      paddingVertical: 25, // Increased vertical padding
      paddingHorizontal: 15,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center', // Center content vertically
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 }, // Slightly increased shadow
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 3,
      minHeight: 140, // Ensure items have a minimum height
    },
    menuIcon: {
      fontSize: 36, // Larger icon
      marginBottom: 12,
      color: '#4CAF50', // Use a theme color for icons
    },
    menuText: { // Renamed from menuTitle for consistency
      fontSize: 15, // Slightly smaller text
      fontWeight: '600', // Bolder text
      color: '#444', // Darker gray
      textAlign: 'center',
      marginTop: 5, // Add some space above text if icon is small
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#f8f9fa', // Match container background
    },
    loadingText: {
      marginTop: 15,
      fontSize: 16,
      color: '#555',
    },
    // Add styles for the "No Business Found" state if needed
    subtitle: { // Reusing subtitle style for the error message
      fontSize: 16,
      color: '#dc3545', // Use a red color for error emphasis
      textAlign: 'center',
      marginTop: 10,
      paddingHorizontal: 20,
    },
});
