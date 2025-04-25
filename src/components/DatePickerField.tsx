import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';

interface DatePickerFieldProps {
  label: string;
  value: Date | undefined;
  onChange: (date: Date) => void;
}

export const DatePickerField: React.FC<DatePickerFieldProps> = ({ label, value, onChange }) => {
  const [visible, setVisible] = React.useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity style={styles.input} onPress={() => setVisible(true)}>
        <Text style={{ color: value ? '#000' : '#888' }}>
          {value ? value.toLocaleDateString() : 'Select date'}
        </Text>
      </TouchableOpacity>
      <DateTimePickerModal
        isVisible={visible}
        mode="date"
        date={value || new Date()}
        onConfirm={date => {
          setVisible(false);
          onChange(date);
        }}
        onCancel={() => setVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: { fontWeight: '600', marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    backgroundColor: '#fff',
    minHeight: 40,
    justifyContent: 'center',
  },
});
