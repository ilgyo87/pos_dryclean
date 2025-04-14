// src/screens/Checkout/components/PaymentMethodSelector.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type PaymentMethod = 'CASH' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'STORE_CREDIT' | 'MOBILE_PAYMENT';

interface PaymentMethodSelectorProps {
  selectedMethod: PaymentMethod;
  onSelectMethod: (method: PaymentMethod) => void;
}

const PaymentMethodSelector = ({ selectedMethod, onSelectMethod }: PaymentMethodSelectorProps) => {
  const paymentMethods = [
    { id: 'CASH', label: 'Cash', icon: 'cash-outline' },
    { id: 'CREDIT_CARD', label: 'Credit Card', icon: 'card-outline' },
    { id: 'DEBIT_CARD', label: 'Debit Card', icon: 'card-outline' },
    { id: 'MOBILE_PAYMENT', label: 'Mobile Payment', icon: 'phone-portrait-outline' },
    { id: 'STORE_CREDIT', label: 'Store Credit', icon: 'wallet-outline' },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Payment Method</Text>
      
      <View style={styles.methodsContainer}>
        {paymentMethods.map((method) => (
          <TouchableOpacity
            key={method.id}
            style={[
              styles.methodButton,
              selectedMethod === method.id && styles.selectedMethod
            ]}
            onPress={() => onSelectMethod(method.id as PaymentMethod)}
          >
            <Ionicons 
              name={method.icon as any} 
              size={24} 
              color={selectedMethod === method.id ? '#fff' : '#333'} 
            />
            <Text 
              style={[
                styles.methodText,
                selectedMethod === method.id && styles.selectedMethodText
              ]}
            >
              {method.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  methodsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
  },
  methodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 5,
    margin: 5,
    minWidth: '45%',
  },
  selectedMethod: {
    backgroundColor: '#2196F3',
  },
  methodText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
  },
  selectedMethodText: {
    color: '#fff',
    fontWeight: '500',
  },
});

export default PaymentMethodSelector;