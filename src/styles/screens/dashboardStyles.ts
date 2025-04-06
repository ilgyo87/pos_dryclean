import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    container: {
      backgroundColor: '#f8f9fa',
    },
    header: {
      padding: 20,
      backgroundColor: '#fff',
      borderBottomWidth: 1,
      borderBottomColor: '#eaeaea',
      marginBottom: 15,
    },
    businessHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 5,
    },
    businessName: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#333',
      flex: 1,
    },
    switchBusinessButton: {
      backgroundColor: '#2196F3',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 4,
    },
    switchBusinessText: {
      color: 'white',
      fontWeight: '500',
      fontSize: 12,
    },
    subtitle: {
      fontSize: 16,
      color: '#666',
      marginTop: 5,
    },
    qrCodeContainer: {
      alignItems: 'center', 
      marginTop: 10,      
      marginBottom: 10,   
      minHeight: 120,     
    },
    qrCodeWrapper: {
      padding: 10,             
      backgroundColor: 'white', 
      borderRadius: 5,         
      alignSelf: 'center',      
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    startButton: {
      backgroundColor: '#4CAF50',
      padding: 15,
      borderRadius: 10,
      marginHorizontal: 20,
      marginBottom: 25,
      alignItems: 'center',
    },
    startButtonText: {
      color: 'white',
      fontSize: 18,
      fontWeight: 'bold',
    },
    menuGrid: {
      padding: 10,
      justifyContent: 'space-between',
    },
    menuItem: {
      width: '48%',
      backgroundColor: '#fff',
      padding: 20,
      borderRadius: 10,
      marginBottom: 15,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    menuIcon: {
      fontSize: 32,
      marginBottom: 10,
    },
    menuTitle: {
      fontSize: 16,
      fontWeight: '500',
      color: '#333',
      textAlign: 'center',
    },
    listContentContainer: {
      paddingBottom: 20, // Example padding
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#f8f8f8',
    },
    loadingText: {
      marginTop: 10,
      fontSize: 16,
      color: '#666',
    },
    errorText: {
        textAlign: 'center',
        marginTop: 50,
        fontSize: 18,
        color: 'red',
    },
    noQrText: {
      fontSize: 12,
      color: '#999',
      textAlign: 'center',
    },
  });