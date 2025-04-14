// src/screens/Checkout/components/DueDatePicker.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

interface DueDatePickerProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

const DueDatePicker = ({ selectedDate, onDateChange }: DueDatePickerProps) => {
  const [showPicker, setShowPicker] = useState(false);

  const handleDateChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
    
    if (date) {
      onDateChange(date);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Due Date:</Text>
      
      <TouchableOpacity 
        style={styles.dateSelector}
        onPress={() => setShowPicker(true)}
      >
        <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
        <Ionicons name="calendar" size={24} color="#4CAF50" />
      </TouchableOpacity>

      {(showPicker || Platform.OS === 'ios') && (
        <Modal
          transparent={true}
          visible={showPicker}
          animationType="slide"
          onRequestClose={() => setShowPicker(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.pickerContainer}>
              <View style={styles.pickerHeader}>
                <Text style={styles.pickerTitle}>Select Due Date</Text>
                {Platform.OS === 'ios' && (
                  <TouchableOpacity 
                    style={styles.doneButton}
                    onPress={() => setShowPicker(false)}
                  >
                    <Text style={styles.doneButtonText}>Done</Text>
                  </TouchableOpacity>
                )}
              </View>
              
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display="default"
                onChange={handleDateChange}
                minimumDate={new Date()}
                style={styles.picker}
              />
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    margin: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 10,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ddd',
    flex: 1,
    justifyContent: 'space-between',
  },
  dateText: {
    fontSize: 16,
    color: '#333',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    padding: 20,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  doneButton: {
    padding: 8,
  },
  doneButtonText: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  picker: {
    width: '100%',
    backgroundColor: '#f9f9f9',
  },
});

export default DueDatePicker;
