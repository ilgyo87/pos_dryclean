// src/screens/Checkout/PaymentModal.tsx
import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Switch
} from 'react-native';

interface PaymentModalProps {
  visible: boolean;
  total: number;
  onClose: () => void;
  onComplete: (method: 'cash' | 'card' | 'other') => void;
  printReceipt: boolean;
  setPrintReceipt: (value: boolean) => void;
  loading: boolean;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  visible,
  total,
  onClose,
  onComplete,
  printReceipt,
  setPrintReceipt,
  loading
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Complete Payment</Text>
          
          <Text style={styles.totalText}>
            Total: ${total.toFixed(2)}
          </Text>
          
          <View style={styles.optionsContainer}>
            <Text style={styles.optionsTitle}>Receipt Options:</Text>
            <View style={styles.optionRow}>
              <Text>Print Receipt</Text>
              <Switch
                value={printReceipt}
                onValueChange={setPrintReceipt}
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={printReceipt ? '#4CAF50' : '#f4f3f4'}
              />
            </View>
            <Text style={styles.noteText}>
              QR code will be printed automatically for item tracking
            </Text>
          </View>
          
          <Text style={styles.paymentMethodTitle}>Select Payment Method:</Text>
          
          <View style={styles.paymentButtonsContainer}>
            <TouchableOpacity
              style={[styles.paymentButton, styles.cashButton]}
              onPress={() => onComplete('cash')}
              disabled={loading}
            >
              <Text style={styles.paymentButtonText}>Cash</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.paymentButton, styles.cardButton]}
              onPress={() => onComplete('card')}
              disabled={loading}
            >
              <Text style={styles.paymentButtonText}>Card</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.paymentButton, styles.otherButton]}
              onPress={() => onComplete('other')}
              disabled={loading}
            >
              <Text style={styles.paymentButtonText}>Other</Text>
            </TouchableOpacity>
          </View>
          
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4CAF50" />
              <Text style={styles.loadingText}>Processing payment...</Text>
            </View>
          )}
          
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onClose}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '80%',
    maxWidth: 500,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  totalText: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  optionsContainer: {
    marginBottom: 20,
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 5,
  },
  optionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  noteText: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#666',
    marginTop: 10,
  },
  paymentMethodTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  paymentButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  paymentButton: {
    flex: 1,
    padding: 15,
    borderRadius: 5,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  cashButton: {
    backgroundColor: '#4CAF50',
  },
  cardButton: {
    backgroundColor: '#2196F3',
  },
  otherButton: {
    backgroundColor: '#FF9800',
  },
  paymentButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  loadingContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  cancelButton: {
    padding: 15,
    borderRadius: 5,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
  },
});

export default PaymentModal;
