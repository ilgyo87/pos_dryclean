import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Order } from '../../../types';
import { OrderStatus } from './StatusHeaderBar';

interface OrderCardProps {
  order: Order;
  onPress: (order: Order) => void;
}

const OrderCard: React.FC<OrderCardProps> = ({ order, onPress }) => {
  const formattedDate = new Date(order.createdAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  
  const formattedTime = new Date(order.createdAt).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <TouchableOpacity 
      style={[styles.card, getStatusStyles(order.status as OrderStatus)]} 
      onPress={() => onPress(order)}
    >
      <View style={styles.header}>
        <Text style={styles.orderNumber}>Order #{order._id.substring(0, 8)}</Text>
        <View style={styles.statusContainer}>
          <Text style={styles.dateTime}>{formattedDate} {formattedTime}</Text>
          <View style={[styles.statusBadge, getStatusBadgeStyle(order.status as OrderStatus)]}>
            <Text style={styles.statusText}>{formatStatus(order.status as OrderStatus)}</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.customerInfo}>
        <MaterialIcons name="person" size={16} color="#666" style={styles.icon} />
        <Text style={styles.customerName}>
          {order.customerName || "Customer ID: " + order.customerId.substring(0, 8)}
        </Text>
      </View>
      
      <View style={styles.orderInfo}>
        <View style={styles.infoItem}>
          <MaterialIcons name="shopping-bag" size={16} color="#666" style={styles.icon} />
          <Text style={styles.infoText}>{order.items.length} items</Text>
        </View>
        
        <View style={styles.infoItem}>
          <MaterialIcons name="attach-money" size={16} color="#666" style={styles.icon} />
          <Text style={styles.infoText}>${order.total.toFixed(2)}</Text>
        </View>
      </View>
      
      {order.notes && order.notes.length > 0 && (
        <View style={styles.notesContainer}>
          <MaterialIcons name="notes" size={16} color="#666" style={styles.icon} />
          <Text style={styles.notesText} numberOfLines={1} ellipsizeMode="tail">
            {order.notes[0]}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

// Format status for display
const formatStatus = (status: OrderStatus): string => {
  switch (status) {
    case 'CREATED': return 'New';
    case 'PROCESSING': return 'Processing';
    case 'READY': return 'Ready';
    case 'COMPLETED': return 'Completed';
    case 'CANCELLED': return 'Cancelled';
    default: return status;
  }
};

// Get card style based on status
const getStatusStyles = (status: OrderStatus) => {
  switch (status) {
    case 'CREATED':
      return { borderLeftColor: '#2196F3' }; // Blue
    case 'PROCESSING':
      return { borderLeftColor: '#FFC107' }; // Yellow
    case 'READY':
      return { borderLeftColor: '#4CAF50' }; // Green
    case 'COMPLETED':
      return { borderLeftColor: '#9E9E9E' }; // Grey
    case 'CANCELLED':
      return { borderLeftColor: '#F44336' }; // Red
    default:
      return { borderLeftColor: '#9E9E9E' }; // Default grey
  }
};

// Get status badge style based on status
const getStatusBadgeStyle = (status: OrderStatus) => {
  switch (status) {
    case 'CREATED':
      return { backgroundColor: '#E3F2FD', borderColor: '#2196F3' }; // Light blue
    case 'PROCESSING':
      return { backgroundColor: '#FFF8E1', borderColor: '#FFC107' }; // Light yellow
    case 'READY':
      return { backgroundColor: '#E8F5E9', borderColor: '#4CAF50' }; // Light green
    case 'COMPLETED':
      return { backgroundColor: '#F5F5F5', borderColor: '#9E9E9E' }; // Light grey
    case 'CANCELLED':
      return { backgroundColor: '#FFEBEE', borderColor: '#F44336' }; // Light red
    default:
      return { backgroundColor: '#F5F5F5', borderColor: '#9E9E9E' }; // Default light grey
  }
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 12,
    padding: 12,
    borderLeftWidth: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  dateTime: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  customerName: {
    fontSize: 14,
    color: '#333',
    marginLeft: 4,
  },
  orderInfo: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  icon: {
    marginRight: 4,
  },
  infoText: {
    fontSize: 14,
    color: '#555',
  },
  notesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 8,
  },
  notesText: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
    flex: 1,
  },
});

export default OrderCard;