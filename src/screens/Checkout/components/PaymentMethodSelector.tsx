// src/screens/Checkout/components/PaymentMethodSelector.tsx
import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type PaymentMethodType = 'CASH' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'STORE_CREDIT' | 'MOBILE_PAYMENT';

interface PaymentMethodSelectorProps {
  selectedMethod: PaymentMethodType;
  onSelectMethod: (method: PaymentMethodType) => void;
}

const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({ 
  selectedMethod, 
  onSelectMethod 
}) => {
  const paymentMethods = [
    { id: 'CASH' as PaymentMethodType, label: 'Cash', icon: 'cash-outline' },
    { id: 'CREDIT_CARD' as PaymentMethodType, label: 'Credit Card', icon: 'card-outline' },
    { id: 'DEBIT_CARD' as PaymentMethodType, label: 'Debit Card', icon: 'card-outline' },
    { id: 'MOBILE_PAYMENT' as PaymentMethodType, label: 'Mobile Payment', icon: 'phone-portrait-outline' },
    { id: 'STORE_CREDIT' as PaymentMethodType, label: 'Store Credit', icon: 'wallet-outline' },
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
            onPress={() => onSelectMethod(method.id)}
          >
            <Ionicons 
              name={method.icon as any} 
              size={24} 
              color={selectedMethod === method.id ? '#fff' : '#555'} 
            />
            <Text 
              style={[
                styles.methodText,
                selectedMethod === method.id && styles.selectedMethodText
              ]}
              numberOfLines={1}
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
    backgroundColor: '#fff',
    borderRadius: 8,
    marginTop: 15,
    marginBottom: 20,
    marginHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
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
    fontSize: 14,
    marginLeft: 8,
    color: '#555',
  },
  selectedMethodText: {
    color: '#fff',
    fontWeight: '500',
  },
});

export default PaymentMethodSelector;