
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
    centeredView: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent background
    },
    modalView: {
      margin: 20,
      backgroundColor: "white",
      borderRadius: 20,
      padding: 35,
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 2
      },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
      width: '60%', // Adjust width as needed
    },
     modalTitle: {
      marginBottom: 20,
      textAlign: "center",
      fontSize: 18,
      fontWeight: 'bold',
    },
    input: {
      height: 45,
      borderColor: 'gray',
      borderWidth: 1,
      marginBottom: 15,
      paddingHorizontal: 10,
      borderRadius: 8,
      width: '90%', // Make inputs take full width of modal content area
      fontSize: 16,
    },
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around', // Or 'space-between'
      marginTop: 20,
      width: '100%',
    },
    button: {
      borderRadius: 10,
      paddingVertical: 12,
      paddingHorizontal: 25,
      elevation: 2,
      minWidth: 100, // Ensure buttons have a minimum width
      alignItems: 'center', // Center text/indicator inside button
    },
    buttonSubmit: {
      backgroundColor: "#2196F3", // Blue for submit
    },
    buttonDisabled: {
      backgroundColor: "#a0a0a0", // Darker grey when disabled
    },
    textStyle: {
      color: "white",
      fontWeight: "bold",
      textAlign: "center",
      fontSize: 16,
    },
    textStyleReset: {
      color: "white",
      fontWeight: "bold",
      textAlign: "center",
      fontSize: 16,
    },
    buttonReset: {
      backgroundColor: "#2196F3", // Blue for reset
    },
    buttonCancel: {
      backgroundColor: "red", // Red for cancel
    },
    textStyleCancel: {
      color: "white",
      fontWeight: "bold",
      textAlign: "center",
      fontSize: 16,
    },
  });