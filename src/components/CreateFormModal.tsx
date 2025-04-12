import React from 'react';
import { Modal, View, Text, StyleSheet } from 'react-native';
import BusinessForm from './BusinessForm';
import CustomerForm from '../screens/Customers/components/CustomerForm';
import { CreateFormModalProps } from '../types';

const CreateFormModal: React.FC<CreateFormModalProps> = ({
  visible,
  onClose,
  params,
  type,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>{type}</Text>
          {type === 'Business' && (
            <BusinessForm userId={params.userId} onCloseModal={onClose} />
          )}
          {type === 'Customer' && (
            <CustomerForm userId={params.userId} onCloseModal={onClose} />
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '80%',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
});

export default CreateFormModal;