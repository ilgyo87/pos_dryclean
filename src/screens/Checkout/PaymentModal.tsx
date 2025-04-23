import React from 'react';
import { View, Text, TouchableOpacity, Switch, Modal, StyleSheet } from 'react-native';

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
              style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}
              onPress={() => setPaymentMethod(method as PaymentMethod)}
            >
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  borderWidth: 2,
                  borderColor: '#007bff',
                  marginRight: 8,
                  backgroundColor: paymentMethod === method ? '#007bff' : '#fff',
                }}
              />
              <Text style={{ fontSize: 16 }}>{method.charAt(0).toUpperCase() + method.slice(1)}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={{ marginVertical: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
            <Switch value={printReceipt} onValueChange={setPrintReceipt} />
            <Text style={{ marginLeft: 10 }}>Print Receipt</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
            <Switch value={notifyTxt} onValueChange={setNotifyTxt} />
            <Text style={{ marginLeft: 10 }}>Text Notification</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
            <Switch value={notifyEmail} onValueChange={setNotifyEmail} />
            <Text style={{ marginLeft: 10 }}>Email Notification</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16 }}>
          <TouchableOpacity
            style={[styles.cancelButton, { marginRight: 12 }]}
            onPress={onCancel}
            disabled={saving}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={onConfirm}
            disabled={saving}
          >
            <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Confirm'}</Text>
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
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cancelButton: {
    padding: 10,
    marginRight: 10,
  },
  cancelButtonText: {
    color: '#666',
  },
  saveButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 4,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default PaymentModal;
