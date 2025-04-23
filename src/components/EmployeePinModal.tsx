import React, { useEffect, useState } from 'react';
import { Modal, View, StyleSheet, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';

interface EmployeePinModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (employee: { employeeId: string; firstName: string; lastName: string }) => void;
  employees: Array<{ _id: string; firstName: string; lastName: string; pin: string }>;
  loading?: boolean;
}

export const EmployeePinModal: React.FC<EmployeePinModalProps> = ({ visible, onClose, onSuccess, employees, loading }) => {
  // Reset PIN and error when modal opens or closes
  // Only reset PIN and error when modal closes (visible goes from true to false)
  const prevVisible = React.useRef(visible);
  React.useEffect(() => {
    if (prevVisible.current && !visible) {
      setPin('');
      setError(null);
      setSubmitting(false);
    }
    prevVisible.current = visible;
  }, [visible]);
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = React.useRef<any>(null);

  React.useEffect(() => {
    if (visible && inputRef.current) {
      setTimeout(() => {
        inputRef.current.focus();
      }, 100);
    }
  }, [visible]);



  const handleSubmit = (pinValue: string) => {
    console.log('[EmployeePinModal] Submitting PIN:', pinValue);
    setSubmitting(true);
    setError(null);
    const match = employees.find(e => e.pin && e.pin.toLowerCase() === pinValue.toLowerCase());
    setTimeout(() => {
      setSubmitting(false);
      if (match) {
        onSuccess({ employeeId: match._id, firstName: match.firstName, lastName: match.lastName });
        setPin('');
        setError(null);
      } else {
        setError('Invalid PIN');
      }
    }, 500);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>Employee Sign In</Text>
          <TextInput
            ref={inputRef}
            style={styles.input}
            value={pin}
            onChangeText={text => {
              // Only allow numeric input
              const raw = text.replace(/[^0-9]/g, '');
              setPin(raw);
              setError(null);
              if (raw.length === 4) {
                setTimeout(() => handleSubmit(raw), 100); // slight delay for UX
              }
            }}
            placeholder="Enter 4-char PIN"
            maxLength={4}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="number-pad"
            secureTextEntry
            editable={!submitting && !loading}
            selectTextOnFocus
          />
          {error && <Text style={styles.error}>{error}</Text>}
          <TouchableOpacity
            style={{ position: 'absolute', top: 12, right: 12, zIndex: 10, padding: 8 }}
            onPress={onClose}
            disabled={submitting || loading}
            accessibilityLabel="Close"
          >
            <Text style={{ fontSize: 24, color: '#888' }}>×</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    width: '95%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'stretch',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    alignSelf: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 18,
    marginBottom: 12,
    backgroundColor: '#f9f9f9',
    textAlign: 'center',
    letterSpacing: 2,
  },
  error: {
    color: '#d9534f',
    marginBottom: 12,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  button: {
    flex: 1,
    backgroundColor: '#007bff',
    borderRadius: 8,
    paddingVertical: 12,
    marginHorizontal: 6,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
