import React from 'react';
import { View, Text, TouchableOpacity, Switch, Modal, StyleSheet, ActivityIndicator } from 'react-native';

export type PaymentMethod = 'cash' | 'card' | 'venmo' | 'saved';

interface PaymentModalProps {
  visible: boolean;
  paymentMethod: PaymentMethod;
  setPaymentMethod: (method: PaymentMethod) => void;
  printReceipt: boolean;
  setPrintReceipt: (v: boolean) => void;
  notifyTxt: boolean;
  setNotifyTxt: (v: boolean) => void;
  notifyEmail: boolean;
  setNotifyEmail: (v: boolean) => void;
  saving: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  visible,
  paymentMethod,
  setPaymentMethod,
  printReceipt,
  setPrintReceipt,
  notifyTxt,
  setNotifyTxt,
  notifyEmail,
  setNotifyEmail,
  saving,
  onCancel,
  onConfirm,
}) => (
  <Modal
    visible={visible}
    transparent
    animationType="slide"
    onRequestClose={onCancel}
  >
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>Select Payment Method</Text>
        <View style={{ marginVertical: 12 }}>
          {['cash', 'card', 'venmo', 'saved'].map((method) => (
            <TouchableOpacity
              key={method}
              style={[styles.paymentOption, paymentMethod === method && styles.selectedPaymentOption]}
              onPress={() => setPaymentMethod(method as PaymentMethod)}
              disabled={saving}
            >
              <View
                style={[
                  styles.radioCircle,
                  paymentMethod === method && styles.radioCircleSelected
                ]}
              />
              <Text style={styles.paymentLabel}>
                {method.charAt(0).toUpperCase() + method.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={{ marginVertical: 12 }}>
          <View style={styles.optionRow}>
            <Switch 
              value={printReceipt} 
              onValueChange={setPrintReceipt} 
              disabled={saving}
            />
            <Text style={styles.optionLabel}>Print Receipt</Text>
          </View>
          <View style={styles.optionRow}>
            <Switch 
              value={notifyTxt} 
              onValueChange={setNotifyTxt} 
              disabled={saving}
            />
            <Text style={styles.optionLabel}>Text Notification</Text>
          </View>
          <View style={styles.optionRow}>
            <Switch 
              value={notifyEmail} 
              onValueChange={setNotifyEmail} 
              disabled={saving}
            />
            <Text style={styles.optionLabel}>Email Notification</Text>
          </View>
        </View>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.cancelButton, saving && styles.disabledButton]}
            onPress={onCancel}
            disabled={saving}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.confirmButton, saving && styles.disabledButton]}
            onPress={onConfirm}
            disabled={saving}
          >
            {saving ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.confirmButtonText}>Processing...</Text>
              </View>
            ) : (
              <Text style={styles.confirmButtonText}>Confirm</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    maxHeight: '80%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 8,
  },
  selectedPaymentOption: {
    backgroundColor: '#f0f8ff',
    borderRadius: 6,
    padding: 8,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#007bff',
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleSelected: {
    backgroundColor: '#fff',
    borderColor: '#007bff',
  },
  paymentLabel: {
    fontSize: 16,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  optionLabel: {
    marginLeft: 10,
    fontSize: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginRight: 12,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
  },
  confirmButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  disabledButton: {
    opacity: 0.6,
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default PaymentModal;