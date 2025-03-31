import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  Modal,
  SafeAreaView,
  Platform,
  FlatList
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import {
  processCardPayment,
  processApplePayment,
  createTransactionRecord,
  initializeSquarePayments,
  generateReceipt,
  saveOrShareReceipt,
  getMockPaymentUIState,
  showMockPaymentUI
} from '../utils/PaymentService';
import { CartItem, PaymentResult } from '../types/PaymentTypes';
import WebView from 'react-native-webview';
import { captureRef } from 'react-native-view-shot';
import Share from 'react-native-share';
// Import the MockPaymentModal component
import MockPaymentModal from '../utils/MockPaymentUI';


// Initialize Amplify client
const client = generateClient<Schema>();

// Define types for our navigation
type RootStackParamList = {
  Checkout: {
    businessId: string;
    customerId: string;
    customerName: string;
    items: CartItem[];
    total: number;
    pickupDate: string;
    customerPreferences: string;
  };
  Dashboard: {};
  Receipt: {
    receiptHtml: string;
    transactionId: string;
  };
};

type CheckoutScreenRouteProp = RouteProp<RootStackParamList, 'Checkout'>;
type CheckoutScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function CheckoutScreen() {
  const route = useRoute<CheckoutScreenRouteProp>();
  const navigation = useNavigation<CheckoutScreenNavigationProp>();

  const {
    businessId,
    customerId,
    customerName,
    items,
    total,
    pickupDate,
    customerPreferences
  } = route.params;

  const [isProcessing, setIsProcessing] = useState(false);
  const [businessDetails, setBusinessDetails] = useState<Schema['Business']['type'] | null>(null);
  const [currentStep, setCurrentStep] = useState<'checkout' | 'payment' | 'receipt'>('checkout');
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [receiptHtml, setReceiptHtml] = useState<string>('');
  const [showReceipt, setShowReceipt] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isReceiptReady, setIsReceiptReady] = useState(false);

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Initialize Square Payments SDK
  useEffect(() => {
    const init = async () => {
      const initialized = await initializeSquarePayments();
      setIsInitialized(initialized);
      if (!initialized) {
        Alert.alert(
          'Payment Setup Error',
          'There was an error setting up the payment system. Please try again later.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
    };

    init();
  }, []);

  // Fetch business details
  useEffect(() => {
    const fetchBusinessDetails = async () => {
      try {
        const response = await client.models.Business.get({ id: businessId });
        if (response.data) {
          setBusinessDetails(response.data);
        }
      } catch (error) {
        console.error('Error fetching business details:', error);
      }
    };

    fetchBusinessDetails();
  }, [businessId]);

  // Calculate subtotal
  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  // Calculate tax (assuming 8% tax rate - this should be configurable)
  const calculateTax = () => {
    const taxRate = 0.08; // 8%
    return calculateSubtotal() * taxRate;
  };

  // Process payment
  const handlePayment = async (method: 'card' | 'applepay') => {
    if (!isInitialized) {
      Alert.alert('Error', 'Payment system is not initialized');
      return;
    }

    setIsProcessing(true);

    try {
      let result: PaymentResult;

      if (method === 'card') {
        result = await processCardPayment(total);
      } else if (method === 'applepay' && Platform.OS === 'ios') {
        result = await processApplePayment(
          total,
          'USD',
          businessDetails?.name || 'Dry Cleaning'
        );
      } else {
        throw new Error('Unsupported payment method');
      }

      setPaymentResult(result);

      // If payment was successful, create transaction record
      if (result.success) {
        const txId = await createTransactionRecord(
          businessId,
          customerId,
          items,
          total,
          result,
          pickupDate,
          customerPreferences
        );

        if (txId) {
          setTransactionId(txId);

          // Generate receipt HTML
          const receipt = generateReceipt(
            txId,
            businessDetails?.name || 'Dry Cleaning Business',
            customerName,
            items,
            total,
            result,
            pickupDate
          );

          setReceiptHtml(receipt);
          setIsReceiptReady(true);
          setCurrentStep('receipt');
        } else {
          Alert.alert(
            'Transaction Error',
            'Payment was successful, but there was an error creating the transaction record.'
          );
        }
      } else {
        Alert.alert(
          'Payment Failed',
          result.error || 'There was an error processing your payment.'
        );
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      Alert.alert(
        'Payment Error',
        error.message || 'There was an error processing your payment.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle viewing receipt in dedicated screen
  const handleViewReceipt = () => {
    if (receiptHtml && isReceiptReady && transactionId) {
      navigation.navigate('Receipt', {
        receiptHtml,
        transactionId
      });
    }
  };

  // Handle sharing receipt
  const handleShareReceipt = async () => {
    if (receiptHtml && isReceiptReady) {
      try {
        // In a real implementation, you would save the receipt or share it
        await saveOrShareReceipt(receiptHtml, transactionId || 'unknown');

        // For demonstration, we'll show a success message
        Alert.alert(
          'Receipt Saved',
          'The receipt has been saved successfully.',
          [
            {
              text: 'Back to Dashboard',
              onPress: () => navigation.navigate('Dashboard', {})
            }
          ]
        );
      } catch (error) {
        console.error('Error sharing receipt:', error);
        Alert.alert('Error', 'Failed to share receipt');
      }
    }
  };

  // Render checkout summary
  const renderCheckoutSummary = () => (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Checkout</Text>

        <View style={styles.headerRight} />
      </View>

      <View style={styles.checkoutSection}>
        <Text style={styles.sectionTitle}>Order Summary</Text>

        <View style={styles.customerInfo}>
          <Text style={styles.customerName}>{customerName}</Text>
          <Text style={styles.pickupDate}>Pickup Date: {formatDate(pickupDate)}</Text>
          {customerPreferences ? (
            <Text style={styles.preferences}>Notes: {customerPreferences}</Text>
          ) : null}
        </View>

        <View style={styles.itemsContainer}>
          {items.map((item, index) => (
            <View key={`${item.id}-${index}`} style={styles.itemRow}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemQuantity}>
                  {item.quantity} × ${item.price.toFixed(2)}
                </Text>
              </View>
              <Text style={styles.itemTotal}>
                ${(item.quantity * item.price).toFixed(2)}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.divider} />

        <View style={styles.totalSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>${calculateSubtotal().toFixed(2)}</Text>
          </View>

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tax (8%)</Text>
            <Text style={styles.totalValue}>${calculateTax().toFixed(2)}</Text>
          </View>

          <View style={[styles.totalRow, styles.grandTotal]}>
            <Text style={styles.grandTotalLabel}>Total</Text>
            <Text style={styles.grandTotalValue}>${total.toFixed(2)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.paymentSection}>
        <Text style={styles.sectionTitle}>Payment Method</Text>

        <TouchableOpacity
          style={styles.paymentButton}
          onPress={() => handlePayment('card')}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.paymentButtonText}>Pay with Credit Card</Text>
          )}
        </TouchableOpacity>

        {Platform.OS === 'ios' && (
          <TouchableOpacity
            style={[styles.paymentButton, styles.applePayButton]}
            onPress={() => handlePayment('applepay')}
            disabled={isProcessing}
          >
            <Text style={[styles.paymentButtonText, styles.applePayButtonText]}>
              Pay with Apple Pay
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );

  // Render receipt
  const renderReceipt = () => (
    <SafeAreaView style={styles.receiptContainer}>
      <View style={styles.receiptHeader}>
        <Text style={styles.receiptTitle}>Receipt</Text>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => navigation.navigate('Dashboard', {})}
        >
          <Text style={styles.closeButtonText}>Done</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.receiptContent}>
        {isReceiptReady ? (
          <>
            <WebView
              source={{ html: receiptHtml }}
              style={styles.webview}
            />

            <View style={styles.receiptActions}>
              <TouchableOpacity
                style={styles.viewButton}
                onPress={handleViewReceipt}
              >
                <Text style={styles.viewButtonText}>View Full Receipt</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.shareButton}
                onPress={handleShareReceipt}
              >
                <Text style={styles.shareButtonText}>Share Receipt</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.doneButton}
                onPress={() => navigation.navigate('Dashboard', {})}
              >
                <Text style={styles.doneButtonText}>Back to Dashboard</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2196F3" />
            <Text style={styles.loadingText}>Generating receipt...</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );

  // Render loading state
  if (!isInitialized) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Initializing payment system...</Text>
      </View>
    );
  }

  // Get mock payment UI state
  const mockPaymentState = getMockPaymentUIState();

  // Main render
  return (
    <View style={styles.container}>
      {currentStep === 'checkout' && renderCheckoutSummary()}
      {currentStep === 'receipt' && renderReceipt()}

      {/* Modal for showing receipt */}
      <Modal
        visible={showReceipt}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowReceipt(false)}
      >
        {renderReceipt()}
      </Modal>

      {/* Render the MockPaymentModal */}
      <MockPaymentModal
        visible={mockPaymentState.visible}
        amount={mockPaymentState.amount}
        onClose={mockPaymentState.onClose}
        onPaymentComplete={mockPaymentState.onPaymentComplete}
        merchantName={mockPaymentState.merchantName}
        paymentMethod={mockPaymentState.paymentMethod}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#2196F3',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerRight: {
    width: 50, // to balance the header
  },
  checkoutSection: {
    backgroundColor: '#fff',
    margin: 15,
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  customerInfo: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 5,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 5,
  },
  pickupDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  preferences: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  itemsContainer: {
    marginBottom: 15,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    marginBottom: 4,
  },
  itemQuantity: {
    fontSize: 14,
    color: '#666',
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 15,
  },
  totalSection: {
    marginBottom: 10,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 16,
    color: '#666',
  },
  totalValue: {
    fontSize: 16,
    color: '#333',
  },
  grandTotal: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  grandTotalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  grandTotalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  paymentSection: {
    backgroundColor: '#fff',
    margin: 15,
    marginTop: 0,
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  paymentButton: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  paymentButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  applePayButton: {
    backgroundColor: '#000',
  },
  applePayButtonText: {
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },

  // Receipt styles
  receiptContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  receiptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  receiptTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 16,
    color: '#2196F3',
  },
  receiptContent: {
    flex: 1,
    backgroundColor: '#fff',
    margin: 15,
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  webview: {
    flex: 1,
    backgroundColor: '#fff',
  },
  receiptActions: {
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  viewButton: {
    backgroundColor: '#4CAF50', // Green color
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  viewButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  shareButton: {
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  shareButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  doneButton: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  doneButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '500',
  },
});