// src/components/Customers/CustomerList.tsx
import React from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { Customer } from '../../../types';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

interface CustomerListProps {
  customers: Customer[];
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
  onCustomerSelect?: (customer: Customer) => void;
}

const CustomerList: React.FC<CustomerListProps> = ({ 
  customers, 
  isLoading, 
  error, 
  onRefresh,
  onCustomerSelect
}) => {
  // Sort customers by last name
  const sortedCustomers = [...customers].sort((a, b) => 
    a.lastName.localeCompare(b.lastName)
  );
  
  if (isLoading && customers.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }
  
  if (error && customers.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Error loading customers</Text>
        <Text>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  if (customers.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <MaterialIcons name="person-outline" size={50} color="#ccc" />
        <Text style={styles.emptyText}>No customers found</Text>
      </View>
    );
  }
  
  return (
    <FlatList
      data={sortedCustomers}
      keyExtractor={item => item._id}
      renderItem={({ item }) => (
        <TouchableOpacity 
          style={styles.customerItem}
          onPress={() => onCustomerSelect && onCustomerSelect(item)}
        >
          <View style={styles.customerInitial}>
            <Text style={styles.initialText}>
              {`${item.firstName[0]}${item.lastName[0]}`}
            </Text>
          </View>
          <View style={styles.customerInfo}>
            <Text style={styles.customerName}>
              {`${item.lastName}, ${item.firstName}`}
            </Text>
            {item.phone && <Text style={styles.customerPhone}>{item.phone}</Text>}
          </View>
          <MaterialIcons name="chevron-right" size={24} color="#ccc" />
        </TouchableOpacity>
      )}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={onRefresh} />
      }
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
    paddingBottom: 80, // Extra space for FAB
  },
  customerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
  },
  customerInitial: {
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
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '500',
  },
  customerPhone: {
    color: '#666',
    marginTop: 4,
  },
  separator: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginLeft: 72,
  },
});

export default CustomerList;