// src/screens/Customers/styles/CustomersStyles.ts
import { StyleSheet } from "react-native";

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  searchContainer: {
    marginVertical: 16,
    width: "100%",
    zIndex: 100,
  },
  content: {
    flex: 1,
    padding: 16,
    width: "100%",
  },
});