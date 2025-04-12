import { Alert, StyleSheet, TouchableOpacity, Text, View } from "react-native";
import { useEffect, useState } from "react";
import type { CancelResetCreateButtonsProps } from "../types";

export default function CancelResetCreateButtons({
  onCancel,
  onReset,
  onCreate,
  isValid,
  isLoading,
  entityType,
  isEdit,
  data,
  onDelete
}: CancelResetCreateButtonsProps) {

  const handleDelete = () => {
    if (!data || !onDelete) return;

    Alert.alert(
      `Delete ${entityType}`,
      `Are you sure you want to delete this ${entityType?.toLowerCase()}? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await onDelete(data);
              Alert.alert("Success", `${entityType} deleted successfully!`);
              onCancel();
            } catch (error) {
              console.error(`Error deleting ${entityType}:`, error);
              Alert.alert("Error", `Failed to delete ${entityType}. Please try again.`);
            }
          }
        }
      ]
    );
  };

  const handleCancel = () => {
    Alert.alert(
      'Confirm Cancellation',
      'Are you sure you want to cancel? Any unsaved changes will be lost.',
      [
        {
          text: 'No, Continue',
          style: 'cancel',
        },
        {
          text: 'Yes, Cancel',
          onPress: onCancel,
          style: 'destructive',
        },
      ]
    );
  };

  const handleCreateEntity = async () => {
    try {
      // Try to execute the onCreate function
      await onCreate(data);
      
      // If we get here, close the modal - success alerts are handled by the specific forms
      onCancel();
    } catch (error) {
      // Error alerts are handled by the specific forms
      console.error(`Error ${isEdit ? 'updating' : 'creating'} ${entityType}:`, error);
      // Do not call onCancel() here - we want to keep the form open on errors
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.cancelButton}
        onPress={onCancel}
      >
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.resetButton}
        onPress={onReset}
      >
        <Text style={styles.resetButtonText}>Reset</Text>
      </TouchableOpacity>

      {isEdit && onDelete && (
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDelete}
        >
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={[
          styles.createButton,
          (!isValid || isLoading) && styles.disabledButton
        ]}
        onPress={handleCreateEntity}
        disabled={!isValid || isLoading}
      >
        <Text style={styles.createButtonText}>
          {isLoading ? "Processing..." : isEdit ? "Update" : "Create"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: 'white',
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  resetButton: {
    backgroundColor: 'skyblue',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    marginRight: 10,
  },
  resetButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  cancelButton: {
    backgroundColor: '#ff6b6b',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    marginRight: 10,
  },
  cancelButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  createButton: {
    backgroundColor: '#4ecdc4',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  createButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  disabledButton: {
    backgroundColor: '#a0a0a0',
    opacity: 0.7,
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  editButton: {
    backgroundColor: '#6a5acd',
  },
  deleteButton: {
    backgroundColor: '#ff3b30', // Red color for delete
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    marginRight: 10,
  },
  deleteButtonText: {
    color: 'white',
    fontWeight: '500',
  },
});