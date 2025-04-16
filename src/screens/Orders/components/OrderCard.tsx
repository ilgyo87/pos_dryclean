// src/screens/Orders/components/OrderCard.tsx
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Alert,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Order status types
type OrderStatus = 'CREATED' | 'PROCESSING' | 'READY' | 'COMPLETED' | 'CANCELLED' | 'DELIVERY_SCHEDULED' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'FAILED';

interface OrderCardProps {
  order: {
    id: string;
    orderNumber: string;
    orderDate: string;
    status: OrderStatus;
    estimatedTotal?: number;
    taxes?: number;
    tips?: number;
    actualTotal?: number;
    customerId?: string;
    customerName?: string; // This might be added via mapping
  };
  itemsCount: number;
  onPress: () => void;
  onStatusChange: (newStatus: OrderStatus) => void;
}

const OrderCard = ({ order, itemsCount, onPress, onStatusChange }: OrderCardProps) => {
  const [statusModalVisible, setStatusModalVisible] = useState(false);

  // Format date to readable string
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Get status color
  const getStatusColor = (status: OrderStatus): string => {
    switch (status) {
      case 'CREATED':
        return '#2196F3'; // Blue
      case 'PROCESSING':
        return '#FFA000'; // Amber
      case 'READY':
        return '#4CAF50'; // Green
      case 'COMPLETED':
        return '#388E3C'; // Dark Green
      case 'CANCELLED':
        return '#F44336'; // Red
      case 'DELIVERY_SCHEDULED':
        return '#9C27B0'; // Purple
      case 'OUT_FOR_DELIVERY':
        return '#FF5722'; // Deep Orange
      case 'DELIVERED':
        return '#009688'; // Teal
      default:
        return '#757575'; // Grey
    }
  };

  // Format status text
  const formatStatus = (status: OrderStatus): string => {
    return status.replace(/_/g, ' ').toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Get appropriate next status options based on current status
  const getNextStatusOptions = (currentStatus: OrderStatus): OrderStatus[] => {
    switch (currentStatus) {
      case 'CREATED':
        return ['PROCESSING', 'CANCELLED'];
      case 'PROCESSING':
        return ['READY', 'CANCELLED'];
      case 'READY':
        return ['COMPLETED', 'DELIVERY_SCHEDULED', 'CANCELLED'];
      case 'DELIVERY_SCHEDULED':
        return ['OUT_FOR_DELIVERY', 'CANCELLED'];
      case 'OUT_FOR_DELIVERY':
        return ['DELIVERED', 'CANCELLED'];
      case 'COMPLETED':
      case 'DELIVERED':
      case 'CANCELLED':
        return []; // Terminal states, no next status
      default:
        return [];
    }
  };

  // Handle status update
  const handleStatusUpdate = (newStatus: OrderStatus) => {
    // Close modal first
    setStatusModalVisible(false);
    
    // Confirm with user before updating
    Alert.alert(
      'Update Order Status',
      `Are you sure you want to change this order status to ${formatStatus(newStatus)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Update', 
          onPress: () => onStatusChange(newStatus),
          style: 'default'
        },
      ]
    );
  };

  // Get appropriate icon for status
  const getStatusIcon = (status: OrderStatus): string => {
    switch (status) {
      case 'CREATED':
        return 'create-outline';
      case 'PROCESSING':
        return 'refresh-outline';
      case 'READY':
        return 'checkmark-circle-outline';
      case 'COMPLETED':
        return 'checkbox-outline';
      case 'CANCELLED':
        return 'close-circle-outline';
      case 'DELIVERY_SCHEDULED':
        return 'calendar-outline';
      case 'OUT_FOR_DELIVERY':
        return 'car-outline';
      case 'DELIVERED':
        return 'home-outline';
      default:
        return 'help-outline';
    }
  };

  // Calculate total items in the order
  const getTotal = (): string => {
    if (order.actualTotal !== undefined && order.actualTotal !== null) {
      return `${parseFloat(order.actualTotal.toString()).toFixed(2)}`;
    } else if (order.estimatedTotal !== undefined && order.estimatedTotal !== null) {
      return `${parseFloat(order.estimatedTotal.toString()).toFixed(2)}`;
    }
    return 'N/A';
  };

  // Get next status options
  const nextStatusOptions = getNextStatusOptions(order.status);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <Text style={styles.orderNumber}>{order.orderNumber}</Text>
        <Text style={styles.date}>{formatDate(order.orderDate)}</Text>
      </View>

      <View style={styles.details}>
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Ionicons name="person-outline" size={20} color="#666" />
            <Text style={styles.infoText}>
              {order.customerName || 'Customer not found'}
            </Text>
          </View>
          
          <View style={styles.infoItem}>
            <Ionicons name="shirt-outline" size={20} color="#666" />
            <Text style={styles.infoText}>
              {itemsCount} {itemsCount === 1 ? 'Item' : 'Items'}
            </Text>
          </View>
          
          <View style={styles.infoItem}>
            <Ionicons name="cash-outline" size={20} color="#666" />
            <Text style={styles.infoText}>{getTotal()}</Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
          <Ionicons name={getStatusIcon(order.status) as any} size={16} color="#fff" />
          <Text style={styles.statusText}>{formatStatus(order.status)}</Text>
        </View>

        {nextStatusOptions.length > 0 && (
          <TouchableOpacity 
            style={styles.updateButton}
            onPress={() => setStatusModalVisible(true)}
          >
            <Ionicons name="chevron-forward" size={20} color="#4285F4" />
          </TouchableOpacity>
        )}
      </View>

      {/* Status Update Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={statusModalVisible}
        onRequestClose={() => setStatusModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setStatusModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Update Order Status</Text>
              <TouchableOpacity onPress={() => setStatusModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            {nextStatusOptions.map((status) => (
              <TouchableOpacity
                key={status}
                style={styles.statusOption}
                onPress={() => handleStatusUpdate(status)}
              >
                <Ionicons 
                  name={getStatusIcon(status) as any} 
                  size={24} 
                  color={getStatusColor(status)} 
                  style={styles.statusOptionIcon}
                />
                <Text style={styles.statusOptionText}>{formatStatus(status)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 12,
    padding: 16,
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
    marginBottom: 12,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  date: {
    fontSize: 14,
    color: '#666',
  },
  details: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 8,
  },
  infoText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#333',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  updateButton: {
    padding: 8,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    width: '80%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  statusOptionIcon: {
    marginRight: 12,
  },
  statusOptionText: {
    fontSize: 16,
    color: '#333',
  },
});

export default OrderCard;