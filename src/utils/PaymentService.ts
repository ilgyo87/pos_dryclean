// src/utils/PaymentService.ts
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { CartItem, PaymentResult, MockPaymentResult } from '../types/PaymentTypes';

const client = generateClient<Schema>();

// Mock payment UI state management
let mockPaymentModalVisible = false;
let currentMockPaymentAmount = 0;
let currentMockPaymentMethod: 'card' | 'applepay' = 'card';
let mockPaymentMerchantName = 'Dry Clean Business';
let mockPaymentResolve: ((value: PaymentResult) => void) | null = null;
let mockPaymentReject: ((reason: Error) => void) | null = null;

// Show the mock payment UI
export const showMockPaymentUI = (
  visible: boolean,
  amount: number = 0,
  method: 'card' | 'applepay' = 'card'
) => {
  mockPaymentModalVisible = visible;
  currentMockPaymentAmount = amount;
  currentMockPaymentMethod = method;
};

// Get the current state of the mock payment UI
export const getMockPaymentUIState = () => {
  return {
    visible: mockPaymentModalVisible,
    amount: currentMockPaymentAmount,
    paymentMethod: currentMockPaymentMethod,
    merchantName: mockPaymentMerchantName,
    onClose: () => {
      mockPaymentModalVisible = false;
      if (mockPaymentReject) {
        mockPaymentReject(new Error('Payment was cancelled'));
        mockPaymentResolve = null;
        mockPaymentReject = null;
      }
    },
    onPaymentComplete: (result: MockPaymentResult) => {
      mockPaymentModalVisible = false;
      if (mockPaymentResolve) {
        mockPaymentResolve(result);
        mockPaymentResolve = null;
        mockPaymentReject = null;
      }
    }
  };
};

// Initialize payment SDK (mock implementation)
export const initializeSquarePayments = async (): Promise<boolean> => {
  try {
    console.log('Initializing mock payment system');
    // Always returns true for the mock implementation
    return true;
  } catch (error) {
    console.error('Failed to initialize payments:', error);
    return false;
  }
};

// Process a card payment (mock implementation)
export const processCardPayment = async (
  amount: number,
  currency: string = 'USD'
): Promise<PaymentResult> => {
  console.log('Processing card payment with mock implementation');
  
  // Show the mock payment UI
  return new Promise<PaymentResult>((resolve, reject) => {
    mockPaymentResolve = resolve;
    mockPaymentReject = reject;
    showMockPaymentUI(true, amount, 'card');
  });
};

// Process Apple Pay payment (mock implementation)
export const processApplePayment = async (
  amount: number,
  currency: string = 'USD',
  summaryLabel: string = 'Your Purchase'
): Promise<PaymentResult> => {
  console.log('Processing Apple Pay with mock implementation');
  
  // Show the mock payment UI
  return new Promise<PaymentResult>((resolve, reject) => {
    mockPaymentResolve = resolve;
    mockPaymentReject = reject;
    showMockPaymentUI(true, amount, 'applepay');
  });
};

export const createTransactionRecord = async (
  businessId: string,
  customerId: string, // This is required but coming in as undefined
  items: CartItem[],
  total: number,
  paymentResult: PaymentResult,
  pickupDate: string,
  customerPreferences?: string
): Promise<string> => {
  try {
    // Validate required fields
    if (!businessId) {
      throw new Error('Business ID is required');
    }
    
    if (!customerId) {
      // Create a guest customer ID if not provided
      customerId = `guest-${Date.now()}`;
      console.log('Created guest customer ID:', customerId);
    }
    
    // Log the input parameters for debugging
    console.log('Creating transaction with params:', {
      businessId,
      customerId, // Now this should never be undefined
      items: items.length,
      total,
      paymentStatus: paymentResult.success ? 'COMPLETED' : 'FAILED',
      pickupDate
    });

    // Create the transaction in your database
    const result = await client.models.Transaction.create({
      businessID: businessId,
      customerID: customerId, // Now this should never be undefined
      orderId: `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      status: paymentResult.success ? 'COMPLETED' : 'FAILED',
      total: total,
      paymentStatus: paymentResult.success ? 'COMPLETED' : 'FAILED',
      transactionDate: new Date().toISOString(),
      pickupDate: pickupDate,
      customerPreferences: customerPreferences || '',
      paymentMethod: 'CREDIT_CARD',
      transactionId: paymentResult.transactionId || '',
      receiptUrl: paymentResult.receiptUrl || '',
    });

    console.log('Transaction creation response:', JSON.stringify(result, null, 2));

    if (!result.data) {
      throw new Error('Failed to create transaction record: No data returned');
    }

    console.log('Transaction created successfully with ID:', result.data.id);
    return result.data.id;
  } catch (error) {
    // Enhanced error logging
    console.error('Transaction creation error details:', error);
    
    // Check for specific error types
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      // Log additional details if it's an API error
      if ('errors' in (error as any)) {
        console.error('API errors:', (error as any).errors);
      }
    }
    
    // Rethrow with more context
    throw new Error(`Failed to create transaction record: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Generate a receipt
export const generateReceipt = (
  transactionId: string,
  businessName: string,
  customerName: string,
  items: CartItem[],
  total: number,
  paymentResult: PaymentResult,
  pickupDate: string
): string => {
  // Format the date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Format the time for display
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const receiptDate = new Date();
  const pickupDateTime = new Date(pickupDate);
  
  // Generate line items for the receipt
  const itemsHtml = items.map(item => `
    <tr>
      <td>${item.name}</td>
      <td>${item.quantity}</td>
      <td>${item.price.toFixed(2)}</td>
      <td>${(item.price * item.quantity).toFixed(2)}</td>
    </tr>
  `).join('');
  
  // Generate full HTML receipt
  const receiptHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 20px;
          color: #333;
        }
        .receipt {
          max-width: 500px;
          margin: 0 auto;
          border: 1px solid #eee;
          padding: 20px;
        }
        .header {
          text-align: center;
          margin-bottom: 20px;
          border-bottom: 1px solid #eee;
          padding-bottom: 10px;
        }
        .business-name {
          font-size: 24px;
          font-weight: bold;
        }
        .transaction-info {
          margin-bottom: 20px;
        }
        .customer-info {
          margin-bottom: 20px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        th, td {
          padding: 8px;
          text-align: left;
          border-bottom: 1px solid #eee;
        }
        th {
          background-color: #f8f8f8;
        }
        .total-row {
          font-weight: bold;
        }
        .footer {
          margin-top: 30px;
          text-align: center;
          font-size: 14px;
          color: #777;
        }
        .payment-info {
          margin: 20px 0;
          padding: 10px;
          background-color: #f8f8f8;
          border-radius: 5px;
        }
      </style>
    </head>
    <body>
      <div class="receipt">
        <div class="header">
          <div class="business-name">${businessName}</div>
          <p>Dry Cleaning Receipt</p>
        </div>
        
        <div class="transaction-info">
          <p><strong>Receipt #:</strong> ${transactionId}</p>
          <p><strong>Date:</strong> ${formatDate(receiptDate)}</p>
          <p><strong>Time:</strong> ${formatTime(receiptDate)}</p>
        </div>
        
        <div class="customer-info">
          <p><strong>Customer:</strong> ${customerName}</p>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
          <tfoot>
            <tr class="total-row">
              <td colspan="3">Total</td>
              <td>$${total.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
        
        <div class="payment-info">
          <p><strong>Payment Method:</strong> ${paymentResult.cardDetails?.brand || 'Credit Card'} ending in ${paymentResult.cardDetails?.lastFourDigits || 'XXXX'}</p>
          <p><strong>Status:</strong> ${paymentResult.success ? 'Paid' : 'Failed'}</p>
          ${paymentResult.transactionId ? `<p><strong>Payment ID:</strong> ${paymentResult.transactionId}</p>` : ''}
        </div>
        
        <div class="pickup-info">
          <p><strong>Pickup Date:</strong> ${formatDate(pickupDateTime)}</p>
        </div>
        
        <div class="footer">
          <p>Thank you for your business!</p>
          ${paymentResult.receiptUrl ? `<p>View online receipt: <a href="${paymentResult.receiptUrl}">${paymentResult.receiptUrl}</a></p>` : ''}
        </div>
      </div>
    </body>
    </html>
  `;
  
  return receiptHtml;
};

// Save receipt to device or share it
export const saveOrShareReceipt = async (
  receiptHtml: string,
  transactionId: string
): Promise<boolean> => {
  // In a real app, you would implement this to save the receipt to a file
  // or share it using the Share API
  console.log('Receipt generated for transaction:', transactionId);
  return true;
};