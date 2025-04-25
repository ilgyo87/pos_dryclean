// src/screens/Checkout/OrderSummary.tsx
import React, { useState } from 'react';
import { useWindowDimensions } from 'react-native';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ListRenderItem,
  Alert,
} from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Product } from '../../types';
import PaymentModal, { PaymentMethod } from './PaymentModal';
import useCheckout, { CheckoutOrderItem } from '../../hooks/useCheckout';
import styles from './OrderSummary.styles';
import OrderItemRow from './OrderItemRow';

export interface OrderItem extends Product {
  quantity: number;
  options?: {
    starch?: 'none' | 'light' | 'medium' | 'heavy';
    pressOnly?: boolean;
    notes?: string;
  };
  _key?: string; // Optional internal key for editing/tracking
}

interface OrderSummaryProps {
  items: OrderItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onUpdateOptions: (productId: string, options: any) => void;
  total: number;
  onCheckout: () => void;
  businessId: string;
  customerId: string;
  employeeId: string;
  employeeName?: string; // Add employee name
  pickupDate?: Date | null;
}

function hashString(str: string): string {
  let hash = 0, i, chr;
  if (str.length === 0) return '0';
  for (i = 0; i < str.length; i++) {
    chr = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash).toString();
}

import type { RootStackParamList } from './CheckoutScreen';
import OptionsModal from './OptionsModal';

const OrderSummary: React.FC<OrderSummaryProps> = ({
  items = [], 
  onUpdateQuantity,
  onUpdateOptions,
  total,
  onCheckout,
  businessId,
  customerId,
  employeeId,
  employeeName,
  pickupDate
}) => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [editingItem, setEditingItem] = useState<OrderItem | null>(null);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [itemNotes, setItemNotes] = useState('');
  const [starchOption, setStarchOption] = useState<'none' | 'light' | 'medium' | 'heavy'>('none');
  const [pressOnly, setPressOnly] = useState(false);

  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [printReceipt, setPrintReceipt] = useState(false);
  const [notifyTxt, setNotifyTxt] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState(false);

  const { checkout, saving } = useCheckout();

  // Open payment modal on checkout
  const handleCheckout = () => {
    if (items.length === 0) {
      Alert.alert('Error', 'Please add items to your order before checkout.');
      return;
    }
    
    if (!pickupDate) {
      Alert.alert('Error', 'Please select a pickup date and time.');
      return;
    }
    
    setShowPaymentModal(true);
  };

  // Confirm payment: use the custom hook
  const handleConfirmPayment = async () => {
    try {
      console.log('[OrderSummary] Confirming payment...');
      console.log('[OrderSummary] Payment method:', paymentMethod);
      console.log('[OrderSummary] Items count:', items.length);
      
      const result = await checkout({
        items: items as CheckoutOrderItem[],
        total,
        paymentMethod,
        businessId,
        customerId,
        employeeId,
        employeeName,
        pickupDate,
        notifications: {
          printReceipt,
          notifyTxt,
          notifyEmail
        }
      });
      
      if (result && result.success) {
        setShowPaymentModal(false);
        
        // Show success message
        Alert.alert(
          'Order Created',
          'Your order has been successfully created.',
          [{ 
            text: 'OK', 
            onPress: () => {
              console.log('[OrderSummary] Navigating to Dashboard after successful checkout');
              // Close modal and navigate back to dashboard
              onCheckout();
              // Use navigation to go back instead of relying on just the callback
              navigation.navigate('DASHBOARD'); // Use navigate instead of goBack
            }
          }]
        );
      } else {
        console.error('[OrderSummary] Checkout failed:', result?.error);
      }
    } catch (e) {
      console.error('[OrderSummary] Payment confirmation error:', e);
    }
  };
  
  const handleEditItem = (item: OrderItem) => {
    const optionsStr = item.options ? JSON.stringify(item.options) : '';
    const itemKey = `${item._id}_${hashString(optionsStr)}`;
    setEditingItem({ ...item, _key: itemKey });
    setItemNotes(item.options?.notes || '');
    setStarchOption(item.options?.starch || 'none');
    setPressOnly(item.options?.pressOnly || false);
    setShowOptionsModal(true);
  };
  
  const handleSaveOptions = () => {
    if (editingItem) {
      // Use the unique key for this item
      const itemKey = editingItem._key || (editingItem.options ? `${editingItem._id}_${hashString(JSON.stringify(editingItem.options))}` : editingItem._id);
      onUpdateOptions(itemKey, {
        starch: starchOption,
        pressOnly,
        notes: itemNotes
      });
      setShowOptionsModal(false);
      setEditingItem(null);
    }
  };

  const { width, height } = useWindowDimensions();
  const isHorizontal = width > height;

  return (
    <View style={[styles.container, isHorizontal && styles.containerNarrow]}>
      <Text style={styles.title}>Order Summary</Text>

      {items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No items in order.</Text>
          <Text style={styles.emptySubtext}>Add products to begin checkout.</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          renderItem={({ item }) => (
            <OrderItemRow
              item={item}
              onUpdateQuantity={onUpdateQuantity}
              onUpdateOptions={onUpdateOptions}
              onEdit={handleEditItem}
            />
          )}
          keyExtractor={(item, idx) => `${item._id}_${idx}`}
          ListEmptyComponent={(
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No items in order.</Text>
              <Text style={styles.emptySubtext}>Add products to begin checkout.</Text>
            </View>
          )}
        />
      )}

      <View style={styles.footer}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text style={styles.totalAmount}>${total.toFixed(2)}</Text>
        </View>

        <TouchableOpacity
          style={[styles.checkoutButton, items.length === 0 && styles.checkoutButtonDisabled]}
          disabled={items.length === 0}
          onPress={handleCheckout}
        >
          <Text style={styles.checkoutButtonText}>Checkout</Text>
        </TouchableOpacity>
      </View>

      <OptionsModal
        visible={showOptionsModal}
        onClose={() => setShowOptionsModal(false)}
        onSelectStarch={(level) => {
          if (editingItem) {
            const itemKey = editingItem._key || (editingItem.options ? `${editingItem._id}_${hashString(JSON.stringify(editingItem.options))}` : editingItem._id);
            onUpdateOptions(itemKey, { ...editingItem.options, starch: level });
            setShowOptionsModal(false);
            setEditingItem(null);
          }
        }}
      />

      <PaymentModal
        visible={showPaymentModal}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
        printReceipt={printReceipt}
        setPrintReceipt={setPrintReceipt}
        notifyTxt={notifyTxt}
        setNotifyTxt={setNotifyTxt}
        notifyEmail={notifyEmail}
        setNotifyEmail={setNotifyEmail}
        saving={saving}
        onCancel={() => setShowPaymentModal(false)}
        onConfirm={handleConfirmPayment}
      />
    </View>
  );
};

export default OrderSummary;