import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: 'rgba(0, 0, 0, 0.4)', // Dim background
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
    width: '90%', // Control modal width
    maxWidth: 500, // Max width for larger screens
    maxHeight: 500, // Max height for larger screens
  },
  modalTitle: {
    marginBottom: 20,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "bold",
  },
  input: {
    height: 50,
    borderColor: "#ccc",
    borderWidth: 1,
    marginBottom: 15,
    paddingHorizontal: 15,
    borderRadius: 8,
    width: '90%',
    fontSize: 16,
  },
  // Style for the container holding the phone input and icon
  phoneInputContainer: {
    position: 'relative',
    width: '90%',
    marginBottom: 15,
  },
  // Style for the phone input itself
  inputPhone: {
    height: 50,
    borderColor: "#ccc",
    borderWidth: 1,
    paddingHorizontal: 15,
    paddingRight: 45, // Increased padding to avoid text overlapping with icon/spinner
    borderRadius: 8,
    width: '100%',
    fontSize: 16,
  },
  inputError: {
    borderColor: "red",
  },
  // New style for when the phone number is available
  inputPhoneAvailable: {
    borderColor: "green",
  },
  // Style for the checkmark/spinner icon
  checkmarkIcon: {
    position: 'absolute',
    right: 15, // Adjusted position
    top: 15,
    fontSize: 30,
    color: 'green', // Default color, spinner might override
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between', // Changed to space-between for 3 buttons
    width: '90%', // Match input width
    marginTop: 10, // Add some space above buttons
  },
  button: {
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20, // Adjust padding as needed
    elevation: 2,
    minWidth: 80, // Ensure buttons have a minimum width
    alignItems: 'center', // Center text/icon horizontally
    justifyContent: 'center', // Center text/icon vertically
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonCancel: {
    backgroundColor: "red", // Red for cancel
  },
  // Added style for Reset button (can customize color)
  buttonReset: {
    backgroundColor: "#ffc107", // Amber color
  },
  buttonSubmit: {
    backgroundColor: "#2196F3", // Blue for submit
  },
  textStyle: {
    color: "white", // Default text style for Submit/Reset
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 16,
  },
  textStyleCancel: {
    color: "white", // White text for cancel button
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 16,
  },
  errorText: {
    color: "red",
    fontSize: 14,
    alignSelf: 'flex-start',
    marginLeft: '5%', // Align with input fields
    marginTop: -10, // Position below input container
    marginBottom: 10,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
});