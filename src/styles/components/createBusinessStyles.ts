import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        padding: 20,
    },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        width: '100%',
    },
    modalView: {
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
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
        color: '#333',
    },
    modalSubtitle: {
        fontSize: 16,
        marginBottom: 20,
        textAlign: 'center',
        color: '#666',
    },
    inputContainer: {
        marginBottom: 15,
    },
    rowContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    cityInput: {
        flex: 2,
        marginRight: 10,
    },
    stateInput: {
        flex: 1,
        marginRight: 10,
    },
    zipInput: {
        flex: 1,
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
    button: {
        backgroundColor: '#2196F3',
        borderRadius: 5,
        padding: 15,
        marginTop: 10,
        alignItems: 'center',
    },
    buttonDisabled: {
        backgroundColor: '#a0d0f7',
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
});