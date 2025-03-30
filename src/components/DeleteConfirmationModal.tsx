import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { styles } from '../styles/screens/productManagementStyles';

interface DeleteConfirmationModalProps {
  visible: boolean;
  itemType: 'service' | 'product' | 'item';
  onClose: () => void;
  onConfirm: () => void;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  visible,
  itemType,
  onClose,
  onConfirm,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.alertOverlay}>
        <View style={styles.alertContainer}>
          <Text style={styles.alertTitle}>Confirm Delete</Text>
          <Text style={styles.alertMessage}>
            Are you sure you want to delete this {itemType}? This action cannot be undone.
          </Text>

          <View style={styles.alertButtonRow}>
            <TouchableOpacity
              style={[styles.alertButton, styles.alertCancelButton]}
              onPress={onClose}
            >
              <Text style={styles.alertCancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.alertButton, styles.alertConfirmButton]}
              onPress={onConfirm}
            >
              <Text style={styles.alertConfirmText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default DeleteConfirmationModal;