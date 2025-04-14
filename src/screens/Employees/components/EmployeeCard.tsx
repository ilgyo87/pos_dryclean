// src/screens/Employees/components/EmployeeCard.tsx
import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Schema } from '../../../../amplify/data/resource';

interface EmployeeCardProps {
  employee: Schema["Employee"]["type"];
  onPress: () => void;
}

export default function EmployeeCard({ employee, onPress }: EmployeeCardProps) {
  // Function to get the appropriate status color
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'ACTIVE':
        return '#4CAF50'; // Green
      case 'INACTIVE':
        return '#F44336'; // Red
      case 'ON_LEAVE':
        return '#FFC107'; // Yellow/Amber
      default:
        return '#9E9E9E'; // Grey
    }
  };

  // Function to format role for display
  const formatRole = (role?: string) => {
    if (!role) return 'Staff';
    
    // Replace underscores with spaces and capitalize each word
    return role.replace(/_/g, ' ')
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
    >
      <View style={[styles.avatar, { backgroundColor: getStatusColor(employee.status || '') }]}>
        <Ionicons name="person" size={24} color="#fff" />
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{employee.firstName} {employee.lastName}</Text>
        <Text style={styles.detail}>{formatRole(employee.role)}</Text>
        {employee.email && <Text style={styles.detail}>{employee.email}</Text>}
        {employee.phoneNumber && <Text style={styles.detail}>{employee.phoneNumber}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={24} color="#cccccc" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginHorizontal: 2,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4285F4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  detail: {
    fontSize: 14,
    color: '#666',
  }
});