import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

export type OrderStatus = 'CREATED' | 'PROCESSING' | 'READY' | 'COMPLETED' | 'CANCELLED' | 'ALL';

interface StatusHeaderBarProps {
  selectedStatus: OrderStatus;
  onSelectStatus: (status: OrderStatus) => void;
  counts: Record<OrderStatus, number>;
}

// StatusHeaderBar component removed as per project requirements.

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
