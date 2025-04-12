// src/screens/Employees/components/EmployeeList.tsx
import React from 'react';
import { FlatList, StyleSheet, RefreshControl, Text, View } from 'react-native';
import EmployeeCard from './EmployeeCard';
import { Schema } from '../../../../amplify/data/resource';

interface EmployeeListProps {
  employees: Schema["Employee"]["type"][];
  onEmployeePress: (employee: Schema["Employee"]["type"]) => void;
  refreshing: boolean;
  onRefresh: () => void;
}

export default function EmployeeList({ 
  employees, 
  onEmployeePress,
  refreshing,
  onRefresh
}: EmployeeListProps) {
  
  if (employees.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No employees found</Text>
      </View>
    );
  }
  
  return (
    <FlatList
      data={employees}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <EmployeeCard employee={item} onPress={() => onEmployeePress(item)} />
      )}
      style={styles.list}
      contentContainerStyle={styles.listContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    />
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
    width: '100%',
  },
  listContent: {
    paddingBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  }
});