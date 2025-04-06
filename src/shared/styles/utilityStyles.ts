import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  // Empty state styles
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },

  emptyText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },

  // Pagination styles
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 4,      // Reduced from 8
    marginBottom: 4,   // Reduced from 8
  },
  
  paginationButton: {
    width: 24,         // Reduced from 32
    height: 24,        // Reduced from 32
    borderRadius: 12,  // Reduced from 16
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 4, // Reduced from 8
  },
  
  paginationText: {
    fontSize: 10,      // Reduced from 12
    color: "#666",
    marginHorizontal: 6, // Reduced from 12
  },

  paginationButtonText: {
    color: "#1890ff",
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },

  paginationButtonDisabled: {
    opacity: 0.5,
  },
});
