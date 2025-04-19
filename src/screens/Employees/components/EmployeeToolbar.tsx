// src/screens/Employees/components/EmployeeToolbar.tsx
import React from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface EmployeeToolbarProps {
  onCreatePress: () => void;
}

export default function EmployeeToolbar({ onCreatePress }: EmployeeToolbarProps) {
  return (
    <View style={styles.toolbar}>
      <TouchableOpacity style={styles.createButton} onPress={onCreatePress}>
        <Ionicons name="add" size={24} color="#fff" />
        <Text style={styles.createButtonText}>New Employee</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingVertical: 12,
    marginBottom: 8,
  },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#34A853", // Green for Employees
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
  },
  createButtonText: {
    color: "#fff",
    marginLeft: 8,
    fontWeight: "500",
  }
});