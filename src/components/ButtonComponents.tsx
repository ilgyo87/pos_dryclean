import { TouchableOpacity, Text, View, StyleSheet, StyleProp, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import React from "react";

// Common ButtonProps interface
interface ButtonProps {
  onPress: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

// Interface with loading prop for buttons that show loading state
interface LoadingButtonProps extends ButtonProps {
  loading?: boolean;
}

// Create Button
export function CreateButton({
  onPress,
  disabled = false,
  loading = false,
  style,
}: LoadingButtonProps): JSX.Element {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        styles.createButton,
        disabled && styles.disabledButton,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <View style={styles.loadingContainer}>
          <Ionicons name="refresh" size={20} color="#fff" />
        </View>
      ) : (
        <View style={styles.buttonContent}>
          <Ionicons name="add-circle-outline" size={18} color="#fff" style={styles.buttonIcon} />
          <Text style={styles.buttonText}>Create</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// Reset Button
export function ResetButton({
  onPress,
  disabled = false,
  style,
}: ButtonProps): JSX.Element {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        styles.resetButton,
        disabled && styles.disabledSecondaryButton,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <View style={styles.buttonContent}>
        <Ionicons name="refresh-outline" size={18} color="#3B82F6" style={styles.buttonIcon} />
        <Text style={styles.resetButtonText}>Reset</Text>
      </View>
    </TouchableOpacity>
  );
}

// Cancel Button
export function CancelButton({
  onPress,
  disabled = false,
  style,
}: ButtonProps): JSX.Element {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        styles.cancelButton,
        disabled && styles.disabledSecondaryButton,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <View style={styles.buttonContent}>
        <Ionicons name="close-outline" size={18} color="#6B7280" style={styles.buttonIcon} />
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </View>
    </TouchableOpacity>
  );
}

// Update Button
export function UpdateButton({
  onPress,
  disabled = false,
  loading = false,
  style,
}: LoadingButtonProps): JSX.Element {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        styles.updateButton,
        disabled && styles.disabledButton,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <View style={styles.loadingContainer}>
          <Ionicons name="refresh" size={20} color="#fff" />
        </View>
      ) : (
        <View style={styles.buttonContent}>
          <Ionicons name="save-outline" size={18} color="#fff" style={styles.buttonIcon} />
          <Text style={styles.buttonText}>Update</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// Delete Button
export function DeleteButton({
  onPress,
  disabled = false,
  loading = false,
  style,
}: LoadingButtonProps): JSX.Element {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        styles.deleteButton,
        disabled && styles.disabledButton,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <View style={styles.loadingContainer}>
          <Ionicons name="refresh" size={20} color="#fff" />
        </View>
      ) : (
        <View style={styles.buttonContent}>
          <Ionicons name="trash-outline" size={18} color="#fff" style={styles.buttonIcon} />
          <Text style={styles.buttonText}>Delete</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// Add these styles to your existing StyleSheet
const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 5,
    minWidth: 110,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonIcon: {
    marginRight: 6,
  },
  createButton: {
    backgroundColor: "#22C55E", // Green
  },
  updateButton: {
    backgroundColor: "#3B82F6", // Blue
  },
  deleteButton: {
    backgroundColor: "#EF4444", // Red
  },
  resetButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#3B82F6",
  },
  cancelButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#6B7280",
  },
  disabledButton: {
    opacity: 0.6,
  },
  disabledSecondaryButton: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
  },
  resetButtonText: {
    color: "#3B82F6",
    fontSize: 16,
    fontWeight: "500",
  },
  cancelButtonText: {
    color: "#6B7280",
    fontSize: 16,
    fontWeight: "500",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
});