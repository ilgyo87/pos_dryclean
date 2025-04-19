import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface CrudButtonsProps {
  onCreate?: () => void;
  onReset?: () => void;
  onUpdate?: () => void;
  onDelete?: () => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
  disabled?: boolean;
  createLabel?: string;
  resetLabel?: string;
  updateLabel?: string;
  deleteLabel?: string;
  cancelLabel?: string;
  showCreate?: boolean;
  showReset?: boolean;
  showUpdate?: boolean;
  showDelete?: boolean;
  showCancel?: boolean;
  error?: string | null;
}

const CrudButtons: React.FC<CrudButtonsProps> = ({
  onCreate,
  onReset,
  onUpdate,
  onDelete,
  onCancel,
  isSubmitting = false,
  disabled = false,
  createLabel = 'Create',
  resetLabel = 'Reset',
  updateLabel = 'Update',
  deleteLabel = 'Delete',
  cancelLabel = 'Cancel',
  showCreate = true,
  showReset = false,
  showUpdate = false,
  showDelete = false,
  showCancel = true,
  error,
}) => (
  <View style={styles.buttonRow}>
    {error ? <Text style={styles.error}>{error}</Text> : null}
    {showCancel && (
      <TouchableOpacity
        style={[styles.button, styles.cancel, (isSubmitting || disabled) && styles.disabled]}
        onPress={onCancel}
        disabled={isSubmitting || disabled}
      >
        <Text style={styles.buttonText}>{cancelLabel}</Text>
      </TouchableOpacity>
    )}
    {showDelete && (
      <TouchableOpacity
        style={[styles.button, styles.danger, (isSubmitting || disabled) && styles.disabled]}
        onPress={onDelete}
        disabled={isSubmitting || disabled}
      >
        <Text style={styles.buttonText}>{deleteLabel}</Text>
      </TouchableOpacity>
    )}
    {showReset && (
      <TouchableOpacity
        style={[styles.button, styles.secondary, (isSubmitting || disabled) && styles.disabled]}
        onPress={onReset}
        disabled={isSubmitting || disabled}
      >
        <Text style={styles.buttonText}>{resetLabel}</Text>
      </TouchableOpacity>
    )}
    {showUpdate && (
      <TouchableOpacity
        style={[styles.button, styles.primary, (isSubmitting || disabled) && styles.disabled]}
        onPress={onUpdate}
        disabled={isSubmitting || disabled}
      >
        <Text style={styles.buttonText}>{updateLabel}</Text>
      </TouchableOpacity>
    )}
    {showCreate && (
      <TouchableOpacity
        style={[styles.button, styles.success, (isSubmitting || disabled) && styles.disabled]}
        onPress={onCreate}
        disabled={isSubmitting || disabled}
      >
        <Text style={styles.buttonText}>{createLabel}</Text>
      </TouchableOpacity>
    )}
    {isSubmitting && <ActivityIndicator style={{ marginLeft: 8 }} />}
  </View>
);

const styles = StyleSheet.create({
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    width: '100%',
  },
  error: {
    color: '#E53935',
    marginBottom: 8,
    textAlign: 'center',
    flex: 1,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginHorizontal: 4,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
  },
  primary: {
    backgroundColor: '#007bff', // update (blue)
  },
  success: {
    backgroundColor: '#28a745', // create (green)
  },
  secondary: {
    backgroundColor: '#6c757d', // reset (grey)
  },
  danger: {
    backgroundColor: '#d9534f', // delete (red)
  },
  cancel: {
    backgroundColor: '#fd7e14', // cancel (orange)
  },
  disabled: {
    opacity: 0.6,
  },
});

export default CrudButtons;
