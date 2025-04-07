// src/screens/OrderManagement/index.tsx
import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { generateClient } from 'aws-amplify/data';
import { Schema } from '../../../amplify/data/resource';
import { styles } from './styles/OrderManagementStyles';

type RootStackParamList = {
  OrderManagement: { businessId: string };
  CustomerSelection: { businessId: string };
};
// Initialize Amplify client
const client = generateClient<Schema>();

export default function OrderManagement({ route }: { route: any }) {
  const { businessId } = route?.params || {};
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    // You can implement fetchOrders function here later
    setLoading(false);
  }, [businessId]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Order Management</Text>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('CustomerSelection', { businessId })}
        >
          <Text style={styles.actionButtonText}>New Order</Text>
        </TouchableOpacity>
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text>Loading orders...</Text>
        </View>
      ) : (
        <View style={styles.contentContainer}>
          <Text>Order management content will appear here</Text>
          <Text>Business ID: {businessId || 'Not provided'}</Text>
        </View>
      )}
    </View>
  );
}