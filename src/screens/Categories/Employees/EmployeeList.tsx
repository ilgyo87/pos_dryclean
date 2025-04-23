import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { Employee } from '../../../types';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

interface EmployeeListProps {
  employees: Employee[];
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
  onEmployeeSelect?: (employee: Employee) => void;
}

const EmployeeList: React.FC<EmployeeListProps> = ({ employees, isLoading, error, onRefresh, onEmployeeSelect }) => {
  const sortedEmployees = [...employees].sort((a, b) => a.lastName.localeCompare(b.lastName));

  if (isLoading && employees.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  if (error && employees.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!isLoading && employees.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>No employees found.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={sortedEmployees}
      keyExtractor={item => item._id}
      renderItem={({ item }) => (
        <TouchableOpacity style={styles.employeeRow} onPress={() => onEmployeeSelect && onEmployeeSelect(item)}>
          <View style={styles.employeeInitial}>
            <Text style={styles.initialText}>{(item.firstName?.[0] || '').toUpperCase()}</Text>
          </View>
          <View style={styles.employeeInfo}>
            <Text style={styles.employeeName}>{`${item.lastName}, ${item.firstName}`}</Text>
            {item.phone && <Text style={styles.employeePhone}>{item.phone}</Text>}

          </View>
          <MaterialIcons name="chevron-right" size={24} color="#ccc" />
        </TouchableOpacity>
      )}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={onRefresh} />}
      contentContainerStyle={styles.listContent}
    />
  );
};

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#d9534f',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#007bff',
    borderRadius: 4,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: 80,
  },
  employeeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
  },
  employeeInitial: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007bff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  initialText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  employeeInfo: {
    flex: 1,
  },
  employeeName: {
    fontSize: 16,
    fontWeight: '500',
  },
  employeePhone: {
    color: '#666',
    marginTop: 4,
  },
  employeePin: {
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
  separator: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginLeft: 72,
  },
});

export default EmployeeList;
