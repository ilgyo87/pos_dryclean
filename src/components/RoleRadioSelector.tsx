import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export type RoleOption = 'Employee' | 'Manager' | 'Admin';

interface RoleRadioSelectorProps {
  value: RoleOption;
  onChange: (role: RoleOption) => void;
  options?: RoleOption[];
}

const RoleRadioSelector: React.FC<RoleRadioSelectorProps> = ({ value, onChange, options = ['Employee', 'Manager', 'Admin'] }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Role</Text>
      <View style={styles.radioGroup}>
        {options.map(option => (
          <TouchableOpacity
            key={option}
            style={styles.radioOption}
            onPress={() => onChange(option)}
            accessibilityRole="radio"
            accessibilityState={{ selected: value === option }}
          >
            <View style={[styles.radioCircle, value === option && styles.radioCircleSelected]} />
            <Text style={styles.radioLabel}>{option}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontWeight: '600',
    marginBottom: 8,
    fontSize: 16,
  },
  radioGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#007bff',
    marginRight: 8,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleSelected: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  radioLabel: {
    fontSize: 16,
    color: '#222',
  },
});

export default RoleRadioSelector;
