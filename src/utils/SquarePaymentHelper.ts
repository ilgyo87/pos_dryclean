import { Platform } from 'react-native';

/**
 * Square payment SDK wrapper that handles conditional imports
 * to avoid simulator crashes with missing CorePaymentCard.framework
 */

// Square SDK types for better type safety
export interface SquareCardDetails {
  nonce: string;
  card?: {
    brand?: string;
    lastFourDigits?: string;
  };
}

// Default mock implementations for simulator
const mockSquareSDK = {
  initializePaymentForm: async () => true,
  startCardEntryFlow: async (
    onCardNonceRequestSuccess: (cardDetails: SquareCardDetails) => void,
    onCardEntryCancel: () => void
  ) => {
    // In simulator, return a mock nonce immediately
    onCardNonceRequestSuccess({
      nonce: 'cnon:mock-nonce-for-simulator',
      card: {
        brand: 'VISA',
        lastFourDigits: '1111',
      },
    });
    return true;
  },
  completeCardEntry: async (onCardEntryComplete: () => void) => {
    onCardEntryComplete();
    return true;
  },
  cancelCardEntryFlow: async () => true,
};

// Mock ApplePay implementation
const mockApplePaySDK = {
  canUseApplePay: () => false,
  initializeApplePay: async () => false,
  requestApplePayNonce: async (
    price: string,
    summaryLabel: string,
    countryCode: string,
    currencyCode: string,
    onApplePayNonceRequestSuccess: (cardDetails: SquareCardDetails) => void,
    onApplePayNonceRequestFailure: (error: Error) => void,
    onApplePayComplete: () => void
  ) => {
    // Mock implementation - in simulator, this would fail
    onApplePayNonceRequestFailure(new Error('Apple Pay not available in simulator'));
  },
  completeApplePayAuthorization: (isSuccess: boolean) => {},
};

// Type for our conditional Square SDK wrapper
type SquareSDKType = {
  SQIPCore: typeof mockSquareSDK;
  SQIPCardEntry: typeof mockSquareSDK;
  SQIPApplePay: typeof mockApplePaySDK;
  isMock: boolean;
  isDisabled?: boolean;
};

// Better simulator detection
const isSimulator = () => {
  if (Platform.OS === 'ios') {
    // iOS simulator detection
    return process.env.SIMULATOR === 'true' || !process.env.SQUARE_PAYMENTS_ENV || __DEV__;
  } else if (Platform.OS === 'android') {
    // Android simulator detection using dev mode as indicator
    return __DEV__; // Simply use dev mode for Android simulator detection
  }
  return false;
};

// Export a dynamic object that will either use real SDK or mocks
const SquareSDK = (() => {
  // If we're on a simulator, use mock implementations
  if (isSimulator()) {
    console.log('Using Square SDK mock implementation for simulator');
    return {
      SQIPCore: mockSquareSDK,
      SQIPCardEntry: mockSquareSDK,
      SQIPApplePay: mockApplePaySDK,
      isMock: true,
      isDisabled: true // Flag to indicate SDK is disabled
    };
  } 
  
  // For real devices, use the actual SDK
  try {
    console.log('Loading actual Square SDK for real device');
    const RealSDK = require('react-native-square-in-app-payments');
    
    return {
      SQIPCore: RealSDK.SQIPCore || mockSquareSDK,
      SQIPCardEntry: RealSDK.SQIPCardEntry || mockSquareSDK,
      SQIPApplePay: RealSDK.SQIPApplePay || mockApplePaySDK,
      isMock: false,
      isDisabled: false
    };
  } catch (error) {
    console.warn('Error loading Square SDK, falling back to mock:', error);
    // Fall back to mock if there's an error loading the real SDK
    return {
      SQIPCore: mockSquareSDK,
      SQIPCardEntry: mockSquareSDK, 
      SQIPApplePay: mockApplePaySDK,
      isMock: true,
      isDisabled: true
    };
  }
})();

export default SquareSDK;
