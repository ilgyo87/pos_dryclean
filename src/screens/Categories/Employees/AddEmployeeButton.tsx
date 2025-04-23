import React, { useState } from 'react';
import { TouchableOpacity, StyleSheet, Text } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import EmployeeForm from './EmployeeForm';

interface AddEmployeeButtonProps {
  onSuccess?: () => void;
}

const AddEmployeeButton: React.FC<AddEmployeeButtonProps> = ({ onSuccess }) => {
  const [showForm, setShowForm] = useState(false);

  return (
    <>
      <TouchableOpacity
        style={styles.fabButton}
        onPress={() => setShowForm(true)}
      >
        <MaterialIcons name="add" size={24} color="white" />
        <Text style={styles.fabText}>Add Employee</Text>
      </TouchableOpacity>
      <EmployeeForm
        visible={showForm}
        onClose={() => setShowForm(false)}
        onSuccess={() => {
          setShowForm(false);
          if (onSuccess) onSuccess();
        }}
      />
    </>
  );
};

const styles = StyleSheet.create({
  fabButton: {
    position: 'absolute',
    right: 24,
    bottom: 32,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007bff',
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  fabText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
});

export default AddEmployeeButton;
