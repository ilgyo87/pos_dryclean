import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

export type OrderStatus = 'CREATED' | 'PROCESSING' | 'READY' | 'COMPLETED' | 'CANCELLED' | 'ALL';

interface StatusHeaderBarProps {
  selectedStatus: OrderStatus;
  onSelectStatus: (status: OrderStatus) => void;
  counts: Record<OrderStatus, number>;
}

const StatusHeaderBar: React.FC<StatusHeaderBarProps> = ({ 
  selectedStatus, 
  onSelectStatus,
  counts
}) => {
  const statuses: { value: OrderStatus; label: string }[] = [
    { value: 'ALL', label: 'All' },
    { value: 'CREATED', label: 'New' },
    { value: 'PROCESSING', label: 'Processing' },
    { value: 'READY', label: 'Ready' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'CANCELLED', label: 'Cancelled' }
  ];

  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {statuses.map(status => (
          <TouchableOpacity
            key={status.value}
            style={[
              styles.statusTab,
              selectedStatus === status.value && styles.selectedTab,
              getStatusColor(status.value)
            ]}
            onPress={() => onSelectStatus(status.value)}
          >
            <Text style={[
              styles.statusText,
              selectedStatus === status.value && styles.selectedStatusText
            ]}>
              {status.label}
              {counts[status.value] > 0 && ` (${counts[status.value]})`}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

// Helper function to get background color based on status
const getStatusColor = (status: OrderStatus) => {
  switch (status) {
    case 'CREATED':
      return { backgroundColor: '#e3f2fd' }; // Light blue
    case 'PROCESSING':
      return { backgroundColor: '#fff9c4' }; // Light yellow
    case 'READY':
      return { backgroundColor: '#e8f5e9' }; // Light green
    case 'COMPLETED':
      return { backgroundColor: '#f5f5f5' }; // Light grey
    case 'CANCELLED':
      return { backgroundColor: '#ffebee' }; // Light red
    default:
      return { backgroundColor: '#f0f0f0' }; // Default light gray
  }
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  scrollContent: {
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  statusTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectedTab: {
    borderColor: '#007bff',
  },
  statusText: {
    fontSize: 14,
    color: '#555',
    fontWeight: '500',
  },
  selectedStatusText: {
    color: '#007bff',
    fontWeight: '600',
  },
});

export default StatusHeaderBar;