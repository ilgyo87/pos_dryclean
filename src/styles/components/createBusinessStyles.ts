import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    // Modal container styles
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        padding: 20,
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 25,
        width: '100%',
        maxWidth: 500,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    scrollView: {
        maxHeight: 400,
        marginBottom: 15,
    },
    
    // Title styles
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
        color: '#333',
    },
    
    // Input styles
    inputContainer: {
        marginBottom: 15,
    },
    inputLabel: {
        fontSize: 16,
        marginBottom: 5,
        color: '#333',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 5,
        padding: 12,
        fontSize: 16,
    },
    inputError: {
        borderColor: 'red',
        borderWidth: 1,
    },
    validatingText: {
        color: '#666',
        fontSize: 14,
        marginTop: 5,
    },
    errorText: {
        color: 'red',
        fontSize: 14,
        marginTop: 5,
    },
    
    // Button styles
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    button: {
        borderRadius: 5,
        padding: 15,
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        height: 50,
    },
    cancelButton: {
        backgroundColor: '#ccc',
        marginRight: 10,
    },
    createButton: {
        backgroundColor: '#2196F3',
    },
    disabledButton: {
        backgroundColor: '#a0d0f7',
        opacity: 0.7,
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    
    // Loading styles
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
        marginLeft: 10,
    }
});