import SquareSDK from './SquarePaymentHelper';
const { SQIPCore, SQIPCardEntry, SQIPApplePay, isMock } = SquareSDK;
import { Platform } from 'react-native';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import type { SquareCardDetails } from './SquarePaymentHelper';

// Initialize Amplify client
const client = generateClient<Schema>();

// Square location ID - You would replace this with your actual location ID
// In a production environment, this should be stored in a secure configuration
const SQUARE_LOCATION_ID = 'YOUR_SQUARE_LOCATION_ID';
const APPLE_PAY_MERCHANT_ID = 'YOUR_APPLE_PAY_MERCHANT_ID';

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  error?: string;
  receiptUrl?: string;
  timestamp: Date;
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  type: 'service' | 'product';
  serviceId?: string;
  imageUrl?: string | null;
}

// Now using the APPLE_PAY_MERCHANT_ID defined at the top of the file

// Initialize Square payment SDK
export const initializeSquarePayments = async (): Promise<boolean> => {
  try {
    // Initialize Square payment form
    await SQIPCore.initializePaymentForm();
    
    // Initialize Apple Pay if on iOS
    if (Platform.OS === 'ios') {
      try {
        // If we're using a mock implementation, this won't actually do anything
        // but will return success so your code flow works
        await SQIPApplePay.initializeApplePay();
        console.log('Apple Pay initialized successfully');
      } catch (applePayError) {
        console.error('Failed to initialize Apple Pay:', applePayError);
        // Continue without Apple Pay - this is not critical
      }
    }
    
    console.log(`Square SDK initialized successfully (${isMock ? 'Simulator Mock' : 'Real Device'})`);
    return true;
  } catch (error) {
    console.error('Failed to initialize Square payments:', error);
    return false;
  }
};

// Process a card payment using Square
export const processCardPayment = async (
  amount: number,
  currency: string = 'USD'
): Promise<PaymentResult> => {
  // Check if SDK is disabled (we're in a simulator)
  if (SquareSDK.isDisabled) {
    console.log('Running in simulator - returning mock payment result');
    // Return a simulated successful payment
    const mockTransactionId = 'sim_' + Math.random().toString(36).substring(2, 15);
    return {
      success: true,
      transactionId: mockTransactionId,
      receiptUrl: `https://example.com/receipt/${mockTransactionId}`,
      timestamp: new Date()
    };
  }
  
  try {
    // Start the card entry flow
    await SQIPCardEntry.startCardEntryFlow(
      ({ nonce }: { nonce: string }) => onCardNonceRequestSuccess(nonce, amount, currency),
      () => onCardEntryCancel()
    );
    
    // This is a placeholder return since the actual result will be handled in callbacks
    return {
      success: false,
      error: 'Payment not completed',
      timestamp: new Date()
    };
  } catch (error: any) {
    console.error('Error processing card payment:', error);
    return {
      success: false,
      error: error.message || 'An unknown error occurred',
      timestamp: new Date()
    };
  }
};

// Handle successful nonce generation
const onCardNonceRequestSuccess = async (
  nonce: string,
  amount: number,
  currency: string
): Promise<PaymentResult> => {
  try {
    // Complete the card entry flow
    await SQIPCardEntry.completeCardEntry(() => {});
    
    // Here you would send the nonce to your backend/server to process the payment
    // For this example, we'll simulate a successful payment
    
    // Normally, you would send the nonce to your server:
    // const paymentResult = await fetch('your-api-endpoint', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     nonce,
    //     amount,
    //     currency,
    //     locationId: SQUARE_LOCATION_ID
    //   })
    // }).then(res => res.json());
    
    // For testing purposes, simulate a successful payment
    const mockTransactionId = 'txn_' + Math.random().toString(36).substring(2, 15);
    
    return {
      success: true,
      transactionId: mockTransactionId,
      receiptUrl: `https://squareup.com/receipt/${mockTransactionId}`,
      timestamp: new Date()
    };
  } catch (error: any) {
    console.error('Payment processing error:', error);
    return {
      success: false,
      error: error.message || 'Failed to process payment',
      timestamp: new Date()
    };
  }
};

// Handle payment cancellation
const onCardEntryCancel = (): PaymentResult => {
  return {
    success: false,
    error: 'Payment was cancelled',
    timestamp: new Date()
  };
};

// Process Apple Pay payment
export const processApplePayment = async (
  amount: number,
  currency: string = 'USD',
  summaryLabel: string = 'Your Purchase'
): Promise<PaymentResult> => {
  if (Platform.OS !== 'ios') {
    return {
      success: false,
      error: 'Apple Pay is only available on iOS devices',
      timestamp: new Date()
    };
  }
  
  try {
    const isApplePayAvailable = await SQIPApplePay.canUseApplePay();
    
    if (!isApplePayAvailable) {
      return {
        success: false,
        error: 'Apple Pay is not available on this device',
        timestamp: new Date()
      };
    }
    
    let paymentResult: PaymentResult = {
      success: false,
      error: 'Payment processing error',
      timestamp: new Date()
    };
    
    await SQIPApplePay.requestApplePayNonce(
      amount.toFixed(2),
      summaryLabel,
      'US',
      currency,
      async (nonce: SquareCardDetails) => {
        // Process the nonce with your backend
        // Similar to card processing above
        const mockTransactionId = 'apay_' + Math.random().toString(36).substring(2, 15);
        
        paymentResult = {
          success: true,
          transactionId: mockTransactionId,
          receiptUrl: `https://squareup.com/receipt/${mockTransactionId}`,
          timestamp: new Date()
        };
      },
      (error: Error) => {
        paymentResult = {
          success: false,
          error: error.message || 'Apple Pay payment failed',
          timestamp: new Date()
        };
      },
      () => {
        // This callback is called when Apple Pay sheet is closed
        console.log('Apple Pay flow completed');
        SQIPApplePay.completeApplePayAuthorization(paymentResult.success);
      }
    );
    
    return paymentResult;
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'An error occurred with Apple Pay',
      timestamp: new Date()
    };
  }
};

// Create a transaction record in your database
export const createTransactionRecord = async (
  businessId: string,
  customerId: string,
  items: CartItem[],
  total: number,
  paymentResult: PaymentResult,
  pickupDate: string,
  customerPreferences?: string
): Promise<string | null> => {
  try {
    // Create the transaction in your database
    const result = await client.models.Transaction.create({
      businessID: businessId,
      customerID: customerId,
      orderId: `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      status: paymentResult.success ? 'COMPLETED' : 'FAILED',
      total: total,
      paymentStatus: paymentResult.success ? 'COMPLETED' : 'FAILED',
      transactionDate: new Date().toISOString(),
      pickupDate: pickupDate,
      customerPreferences: customerPreferences || '',
      paymentMethod: 'CREDIT_CARD',
      transactionId: paymentResult.transactionId || '',
      receiptUrl: paymentResult.receiptUrl || ''
    });
    
    if (result.errors) {
      throw new Error(result.errors.map(e => e.message).join(', '));
    }
    
    if (!result.data?.id) {
      throw new Error('Failed to get transaction ID');
    }
    
    // Create transaction items
    for (const item of items) {
      await client.models.TransactionItem.create({
        transactionID: result.data.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        itemType: item.type.toUpperCase(),
        serviceID: item.serviceId || '',
        productID: item.type === 'product' ? item.id : ''
      });
    }
    
    return result.data.id;
  } catch (error) {
    console.error('Error creating transaction record:', error);
    return null;
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
      <td>$${item.price.toFixed(2)}</td>
      <td>$${(item.price * item.quantity).toFixed(2)}</td>
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
        .pickup-info {
          margin-top: 20px;
          padding: 10px;
          background-color: #f5f5f5;
          border-radius: 5px;
        }
      </style>
    </head>
    <body>
      <div class="receipt">
        <div class="header">
          <div class="business-name">${businessName}</div>
          <div>Receipt</div>
        </div>
        
        <div class="transaction-info">
          <p><strong>Transaction ID:</strong> ${transactionId}</p>
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
          <p><strong>Payment Method:</strong> Credit Card</p>
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