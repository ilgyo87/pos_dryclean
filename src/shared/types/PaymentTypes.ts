// Initialize the payment SDK
// export const initializeSquarePayments = async (): Promise<boolean>;

// // Process card payments
// export const processCardPayment = async (
//   amount: number,
//   currency: string = 'USD'
// ): Promise<PaymentResult>;

// // Process Apple Pay payments (iOS only)
// export const processApplePayment = async (
//   amount: number,
//   currency: string = 'USD',
//   summaryLabel: string = 'Your Purchase'
// ): Promise<PaymentResult>;

// Create a transaction record in the database
// export const createTransactionRecord = async (
//   businessId: string,
//   customerId: string,
//   items: CartItem[],
//   total: number,
//   paymentResult: PaymentResult,
//   pickupDate: string,
//   customerPreferences?: string
// ): Promise<string | null>;

// Generate a receipt in HTML format
// export const generateReceipt = (
//   transactionId: string,
//   businessName: string,
//   customerName: string,
//   items: CartItem[],
//   total: number,
//   paymentResult: PaymentResult,
//   pickupDate: string
// ): string;

// Mock payment UI state management
// export const showMockPaymentUI = (
//   visible: boolean,
//   amount: number = 0,
//   paymentMethod: 'card' | 'applepay' = 'card',
//   merchantName: string = 'Dry Cleaning Business'
// ): void;

// export const getMockPaymentUIState = (): {
//   visible: boolean;
//   amount: number;
//   paymentMethod: 'card' | 'applepay';
//   merchantName: string;
//   onClose: () => void;
//   onPaymentComplete: (result: MockPaymentResult) => void;
// };

// Payment result interface returned after processing a payment
export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  error?: string;
  receiptUrl?: string;
  timestamp: Date;
  cardDetails?: {
    brand?: string;
    lastFourDigits?: string;
  };
}

// Cart item interface for items being purchased
export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  type: 'service' | 'product';
  serviceId?: string;
  imageUrl?: string | null;
}

// Mock payment result interface (used by the mock UI)
export interface MockPaymentResult {
  success: boolean;
  transactionId?: string;
  error?: string;
  receiptUrl?: string;
  timestamp: Date;
}

// Props for the mock payment modal component
export interface MockPaymentModalProps {
  visible: boolean;
  amount: number;
  onClose: () => void;
  onPaymentComplete: (result: MockPaymentResult) => void;
  merchantName: string;
  paymentMethod: 'card' | 'applepay';
}

// Interface for Square card details
export interface SquareCardDetails {
  nonce: string;
  card?: {
    brand?: string;
    lastFourDigits?: string;
  };
}