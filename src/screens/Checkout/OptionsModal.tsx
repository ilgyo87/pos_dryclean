import React from 'react';
import { Modal, View, Text, TouchableOpacity } from 'react-native';
import styles from './OrderSummary.styles';

interface OptionsModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectStarch: (level: 'light' | 'medium' | 'heavy') => void;
} 

const OptionsModal: React.FC<OptionsModalProps> = ({ visible, onClose, onSelectStarch }) => (
  <Modal
    visible={visible}
    transparent
    animationType="fade"
    onRequestClose={onClose}
  >
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 16 }}>Select Starch Level</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
          <TouchableOpacity style={styles.starchBox} onPress={() => onSelectStarch('light')}>
            <Text style={styles.starchBoxText}>L</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.starchBox} onPress={() => onSelectStarch('medium')}>
            <Text style={styles.starchBoxText}>M</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.starchBox} onPress={() => onSelectStarch('heavy')}>
            <Text style={styles.starchBoxText}>H</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

export default OptionsModal;
