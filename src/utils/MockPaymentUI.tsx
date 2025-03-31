import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  Image,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';

// Import card logos from our placeholder asset file
import cardLogos from './CreditCardAssets';

// Mock payment result type
export interface MockPaymentResult {
  success: boolean;
  transactionId?: string;
  error?: string;
  receiptUrl?: string;
  timestamp: Date;
}

// Props for MockPaymentModal
interface MockPaymentModalProps {
  visible: boolean;
  amount: number;
  onClose: () => void;
  onPaymentComplete: (result: MockPaymentResult) => void;
  merchantName: string;
  paymentMethod: 'card' | 'applepay';
}

// Card types supported by the mock UI
const CARD_TYPES = [
  { name: 'Visa', image: cardLogos.visa },
  { name: 'Mastercard', image: cardLogos.mastercard },
  { name: 'American Express', image: cardLogos.amex },
  { name: 'Discover', image: cardLogos.discover },
];

// Mock Credit Card UI Component
const MockPaymentModal: React.FC<MockPaymentModalProps> = ({
  visible,
  amount,
  onClose,
  onPaymentComplete,
  merchantName,
  paymentMethod
}) => {
  // State for card details
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<'card-details' | 'processing' | 'result'>('card-details');
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Reset form when modal opens
  useEffect(() => {
    if (visible) {
      setCardNumber('');
      setExpiryDate('');
      setCvv('');
      setCardholderName('');
      setIsProcessing(false);
      setCurrentStep('card-details');
      setPaymentSuccess(false);
      setErrorMessage('');
    }
  }, [visible]);

  // Format card number as user types
  const formatCardNumber = (text: string) => {
    // Remove all non-digit characters
    const cleaned = text.replace(/\D/g, '');
    
    // Format the card number with spaces after every 4 digits
    let formatted = '';
    for (let i = 0; i < cleaned.length; i++) {
      if (i > 0 && i % 4 === 0) {
        formatted += ' ';
      }
      formatted += cleaned[i];
    }
    
    // Limit to 19 characters (16 digits + 3 spaces)
    return formatted.slice(0, 19);
  };

  // Format expiry date as MM/YY
  const formatExpiryDate = (text: string) => {
    // Remove all non-digit characters
    const cleaned = text.replace(/\D/g, '');
    
    // Format as MM/YY
    if (cleaned.length > 2) {
      return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`;
    } else {
      return cleaned;
    }
  };

  // Validate form
  const validateForm = () => {
    // Card number should be 16 digits
    if (cardNumber.replace(/\D/g, '').length !== 16) {
      setErrorMessage('Invalid card number');
      return false;
    }
    
    // Expiry date should be MM/YY
    if (expiryDate.length !== 5) {
      setErrorMessage('Invalid expiry date');
      return false;
    }
    
    // CVV should be 3 or 4 digits
    if (cvv.length < 3 || cvv.length > 4) {
      setErrorMessage('Invalid CVV');
      return false;
    }
    
    // Cardholder name should not be empty
    if (!cardholderName.trim()) {
      setErrorMessage('Cardholder name is required');
      return false;
    }
    
    return true;
  };

  // Process payment
  const handleSubmit = () => {
    if (!validateForm()) {
      return;
    }
    
    setErrorMessage('');
    setIsProcessing(true);
    setCurrentStep('processing');
    
    // Simulate processing delay
    setTimeout(() => {
      // For demo purposes, succeed for valid test cards, fail for others
      const isTestCard = cardNumber.replace(/\D/g, '').startsWith('4111');
      const success = isTestCard;
      
      setPaymentSuccess(success);
      setIsProcessing(false);
      setCurrentStep('result');
      
      // Generate a mock payment result
      const result: MockPaymentResult = {
        success,
        timestamp: new Date(),
      };
      
      if (success) {
        result.transactionId = `mock_${Math.random().toString(36).substr(2, 9)}`;
        result.receiptUrl = `https://example.com/receipt/${result.transactionId}`;
      } else {
        result.error = 'Payment was declined. Please try a different card.';
      }
      
      // Wait a bit before calling onPaymentComplete
      setTimeout(() => {
        onPaymentComplete(result);
      }, 1500);
    }, 2000);
  };

  // Render card details form
  const renderCardDetailsForm = () => (
    <ScrollView style={styles.scrollView}>
      <Text style={styles.title}>Card Payment</Text>
      <Text style={styles.subtitle}>Pay with credit or debit card</Text>
      
      <View style={styles.cardTypeContainer}>
        {CARD_TYPES.map((card, index) => (
          <Image 
            key={index} 
            source={card.image} 
            style={styles.cardTypeImage} 
            resizeMode="contain" 
          />
        ))}
      </View>
      
      <View style={styles.amountContainer}>
        <Text style={styles.amountLabel}>Amount:</Text>
        <Text style={styles.amount}>${amount.toFixed(2)}</Text>
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Card Number</Text>
        <TextInput
          style={styles.input}
          value={cardNumber}
          onChangeText={(text) => setCardNumber(formatCardNumber(text))}
          placeholder="1234 5678 9012 3456"
          keyboardType="number-pad"
          maxLength={19}
        />
      </View>
      
      <View style={styles.rowContainer}>
        <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
          <Text style={styles.label}>Expiry Date</Text>
          <TextInput
            style={styles.input}
            value={expiryDate}
            onChangeText={(text) => setExpiryDate(formatExpiryDate(text))}
            placeholder="MM/YY"
            keyboardType="number-pad"
            maxLength={5}
          />
        </View>
        
        <View style={[styles.inputGroup, { flex: 1 }]}>
          <Text style={styles.label}>CVV</Text>
          <TextInput
            style={styles.input}
            value={cvv}
            onChangeText={(text) => setCvv(text.replace(/\D/g, ''))}
            placeholder="123"
            keyboardType="number-pad"
            maxLength={4}
            secureTextEntry
          />
        </View>
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Cardholder Name</Text>
        <TextInput
          style={styles.input}
          value={cardholderName}
          onChangeText={setCardholderName}
          placeholder="John Smith"
        />
      </View>
      
      {errorMessage ? (
        <Text style={styles.errorText}>{errorMessage}</Text>
      ) : null}
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={onClose}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.payButton}
          onPress={handleSubmit}
        >
          <Text style={styles.payButtonText}>Pay ${amount.toFixed(2)}</Text>
        </TouchableOpacity>
      </View>
      
      <Text style={styles.secureText}>
        🔒 All transactions are secure and encrypted
      </Text>
      
      <Text style={styles.testCardText}>
        Hint: Use card number starting with 4111 for successful payment
      </Text>
    </ScrollView>
  );

  // Render processing view
  const renderProcessingView = () => (
    <View style={styles.centeredContainer}>
      <ActivityIndicator size="large" color="#2196F3" />
      <Text style={styles.processingText}>Processing payment...</Text>
      <Text style={styles.processingSubtext}>Please do not close this screen</Text>
    </View>
  );

  // Render result view
  const renderResultView = () => (
    <View style={styles.centeredContainer}>
      {paymentSuccess ? (
        <>
          <View style={styles.successIcon}>
            <Text style={styles.checkmark}>✓</Text>
          </View>
          <Text style={styles.resultTitle}>Payment Successful</Text>
          <Text style={styles.resultText}>Your payment has been processed successfully.</Text>
        </>
      ) : (
        <>
          <View style={styles.failureIcon}>
            <Text style={styles.xmark}>✗</Text>
          </View>
          <Text style={styles.resultTitle}>Payment Failed</Text>
          <Text style={styles.resultText}>Your payment could not be processed. Please try again.</Text>
        </>
      )}
    </View>
  );

  // Apple Pay Mock UI
  const renderApplePayView = () => (
    <View style={styles.centeredContainer}>
      <View style={styles.applePayContainer}>
        <Text style={styles.applePayLogo}>Apple Pay</Text>
        <Text style={styles.applePayMerchant}>{merchantName}</Text>
        <Text style={styles.applePayAmount}>${amount.toFixed(2)}</Text>
        
        <View style={styles.applePayButtons}>
          <TouchableOpacity
            style={styles.applePayCancel}
            onPress={onClose}
          >
            <Text style={styles.applePayCancelText}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.applePayConfirm}
            onPress={() => {
              setIsProcessing(true);
              setCurrentStep('processing');
              
              // Simulate processing delay
              setTimeout(() => {
                setPaymentSuccess(true);
                setIsProcessing(false);
                setCurrentStep('result');
                
                // Generate a mock payment result
                const result: MockPaymentResult = {
                  success: true,
                  transactionId: `apay_${Math.random().toString(36).substr(2, 9)}`,
                  receiptUrl: `https://example.com/receipt/apay_${Math.random().toString(36).substr(2, 9)}`,
                  timestamp: new Date()
                };
                
                // Wait a bit before calling onPaymentComplete
                setTimeout(() => {
                  onPaymentComplete(result);
                }, 1500);
              }, 2000);
            }}
          >
            <Text style={styles.applePayConfirmText}>Pay with Face ID</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              {paymentMethod === 'card' ? (
                currentStep === 'card-details' ? renderCardDetailsForm() :
                currentStep === 'processing' ? renderProcessingView() :
                renderResultView()
              ) : (
                currentStep === 'card-details' ? renderApplePayView() :
                currentStep === 'processing' ? renderProcessingView() :
                renderResultView()
              )}
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  keyboardAvoidingView: {
    flex: 1,
    justifyContent: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  scrollView: {
    width: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  cardTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  cardTypeImage: {
    width: 50,
    height: 30,
    marginHorizontal: 5,
  },
  amountContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#f8f8f8',
    borderRadius: 5,
  },
  amountLabel: {
    fontSize: 16,
    color: '#666',
  },
  amount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    marginBottom: 5,
    color: '#666',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    fontSize: 16,
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  errorText: {
    color: 'red',
    marginBottom: 15,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 20,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 5,
    flex: 1,
    marginRight: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: 'bold',
  },
  payButton: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 5,
    flex: 2,
    alignItems: 'center',
  },
  payButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  secureText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 12,
    marginBottom: 10,
  },
  testCardText: {
    textAlign: 'center',
    color: '#007bff',
    fontSize: 12,
    marginBottom: 20,
    fontStyle: 'italic',
  },
  centeredContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  processingText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  processingSubtext: {
    fontSize: 14,
    color: '#666',
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  failureIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F44336',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  checkmark: {
    color: 'white',
    fontSize: 40,
  },
  xmark: {
    color: 'white',
    fontSize: 40,
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  resultText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  applePayContainer: {
    width: '100%',
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  applePayLogo: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 20,
  },
  applePayMerchant: {
    fontSize: 18,
    color: '#666',
    marginBottom: 10,
  },
  applePayAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  applePayButtons: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  applePayCancel: {
    padding: 15,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  applePayCancelText: {
    color: '#333',
    fontSize: 16,
  },
  applePayConfirm: {
    padding: 15,
    backgroundColor: '#000',
    borderRadius: 5,
    alignItems: 'center',
    flex: 2,
  },
  applePayConfirmText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default MockPaymentModal;