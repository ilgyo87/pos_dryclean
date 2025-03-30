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
    marginTop: 8,
    marginBottom: 8,
  },

  paginationButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 8,
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

  paginationText: {
    fontSize: 12,
    color: "#666",
    marginHorizontal: 12,
  },
});
