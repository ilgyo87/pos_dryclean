export interface SquareCardDetails {
    nonce: string;
    card?: {
      brand?: string;
      lastFourDigits?: string;
    };
  }
  
  // Mock implementations
  export const SQIPCore = {
    initializePaymentForm: async () => true,
  };
  
  export const SQIPCardEntry = {
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
  
  export const SQIPApplePay = {
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
      onApplePayNonceRequestFailure(new Error('Apple Pay not available in simulator'));
    },
    completeApplePayAuthorization: (isSuccess: boolean) => {},
  };
  
  export default {
    SQIPCore,
    SQIPCardEntry,
    SQIPApplePay,
    isMock: true,
    isDisabled: false
  };