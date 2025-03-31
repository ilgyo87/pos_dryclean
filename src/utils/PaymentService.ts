// src/utils/PaymentService.ts
import { generateClient } from 'aws-amplify/api'; // Correct API import
import type { Schema } from '../../amplify/data/resource';
import { CartItem, PaymentResult, MockPaymentResult } from '../types/PaymentTypes'; // Make sure this path is correct
import { Share } from 'react-native';
import RNFS from 'react-native-fs'; // Ensure react-native-fs is installed

const client = generateClient<Schema>();

// Mock payment UI state management
let mockPaymentModalVisible = false;
let currentMockPaymentAmount = 0;
let currentMockPaymentMethod: 'card' | 'applepay' = 'card';
let mockPaymentMerchantName = 'Dry Clean Business';
let mockPaymentResolve: ((value: PaymentResult) => void) | null = null;
let mockPaymentReject: ((reason?: any) => void) | null = null; // Allow any reason

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
        // Adapt MockPaymentResult to PaymentResult if needed, or adjust types
        mockPaymentResolve(result as PaymentResult); // Type assertion might be needed
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

// --- UPDATED createTransactionRecord ---
export const createTransactionRecord = async (
    businessId: string,
    customerId: string | null, // Customer ID can be null for guests
    items: CartItem[], // Using CartItem type from import
    total: number,
    paymentResult: PaymentResult, // Using PaymentResult type from import
    pickupDate: string, // Assuming ISO string format e.g., "2024-12-31T14:00:00.000Z"
    customerPreferences?: string
  ): Promise<Schema['Transaction']['type']> => { // Return the created transaction object
    console.log("Attempting to create transaction record...");
    console.log("Payment result:", paymentResult);

    if (!businessId) {
      throw new Error("Business ID is required to create a transaction.");
    }

    // Use guest ID if customerId is null
    const finalCustomerId = customerId || `guest-${Date.now()}`;
    if (!customerId) {
        console.log('Using generated guest customer ID:', finalCustomerId);
    }

    // --- Calculate Financial Fields ---
    // Assuming a fixed tax rate for simplicity. Replace with actual calculation logic.
    const TAX_RATE = 0.08; // Example 8% tax rate
    const subtotal = parseFloat((total / (1 + TAX_RATE)).toFixed(2));
    const tax = parseFloat((total - subtotal).toFixed(2));

    // Generate a simple transaction number
    const transactionNumber = `TXN-${businessId.substring(businessId.length - 4)}-${Date.now()}`;

    // Log the input parameters for debugging
    console.log('Creating transaction with params:', {
      businessId,
      customerId: finalCustomerId,
      itemsCount: items.length,
      subtotal,
      tax,
      total,
      paymentStatus: paymentResult.success ? 'Paid' : 'Failed', // Map success to PaymentStatus
      status: paymentResult.success ? 'Completed' : 'Failed', // Map success to Status
      pickupDate,
      externalTransactionId: paymentResult.transactionId,
      transactionNumber,
      paymentMethod: paymentResult.cardDetails?.brand || 'CREDIT_CARD', // Use card brand or default
      receiptUrl: paymentResult.receiptUrl,
      customerPreferences,
    });

    try {
      // Create the transaction in your database using the updated schema fields
      const result = await client.models.Transaction.create({
        businessID: businessId,
        customerID: finalCustomerId,
        transactionNumber: transactionNumber,
        transactionDate: new Date().toISOString(),
        status: paymentResult.success ? 'Completed' : 'Failed',
        subtotal: subtotal,
        tax: tax,
        // discount: 0, // Optional
        total: total,
        paymentMethod: paymentResult.cardDetails?.brand || 'CREDIT_CARD', // Use card brand or default
        paymentStatus: paymentResult.success ? 'Paid' : 'Failed',
        // notes: 'Optional transaction notes', // Optional
        receiptUrl: paymentResult.receiptUrl || undefined,
        externalTransactionId: paymentResult.transactionId || undefined,
        // employeeID: 'emp-123', // Optional
        orderID: `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`, // Optional
        // qrCode: 's3://...', // Optional
        pickupDate: pickupDate ? new Date(pickupDate).toISOString() : undefined,
        customerPreferences: customerPreferences || undefined,
      });

      console.log('Transaction creation response:', JSON.stringify(result, null, 2));

      if (result.errors) {
          console.error('GraphQL errors during transaction creation:', result.errors);
          throw new Error(`Failed to create transaction record: ${result.errors.map(e => e.message).join(', ')}`);
      }
      if (!result.data) {
        throw new Error('Failed to create transaction record: No data returned');
      }

      console.log('Transaction record created successfully:', result.data.id);
      return result.data; // Return the created transaction data

    } catch (error: any) {
        console.error('Error creating transaction record:', error);
        if (error.response && error.response.errors) {
            console.error('Detailed GraphQL Errors:', JSON.stringify(error.response.errors, null, 2));
        }
        throw new Error(`Error saving transaction: ${error.message || 'Unknown error'}`);
    }
  };
// --- END UPDATED createTransactionRecord ---


// Generate a receipt (HTML Format)
export const generateReceiptHtml = (
    transactionId: string, // Use the actual Transaction ID from DB
    businessName: string,
    customerName: string,
    items: CartItem[],
    total: number,
    tax: number, // Add tax parameter
    subtotal: number, // Add subtotal parameter
    paymentResult: PaymentResult,
    pickupDate: string // ISO String format
): string => {
    // Format the date for display
    const formatDate = (isoString: string | Date): string => {
        if (!isoString) return 'N/A';
        const date = typeof isoString === 'string' ? new Date(isoString) : isoString;
        if (isNaN(date.getTime())) return 'Invalid Date';
        return date.toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
    };

    // Format the time for display
    const formatTime = (isoString: string | Date): string => {
        if (!isoString) return 'N/A';
        const date = typeof isoString === 'string' ? new Date(isoString) : isoString;
        if (isNaN(date.getTime())) return 'Invalid Time';
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit', minute: '2-digit', hour12: true
        });
    };

    const receiptDate = new Date(); // Use current date/time for receipt generation moment

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
          /* (Keep your existing CSS styles here) */
          body { font-family: sans-serif; margin: 20px; color: #333; }
          .receipt { max-width: 400px; margin: auto; border: 1px solid #ccc; padding: 15px; font-size: 14px; }
          .header { text-align: center; margin-bottom: 15px; }
          .business-name { font-size: 1.5em; font-weight: bold; }
          .info p { margin: 3px 0; }
          table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          th, td { padding: 6px; text-align: left; border-bottom: 1px solid #eee; }
          th { background-color: #f8f8f8; font-weight: bold; }
          .totals td { text-align: right; }
          .totals .label { text-align: left; }
          .footer { margin-top: 20px; text-align: center; font-size: 0.9em; color: #777; }
          .payment-info { margin-top: 15px; padding-top: 10px; border-top: 1px dashed #ccc; }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <div class="business-name">${businessName}</div>
            <p>Dry Cleaning Receipt</p>
          </div>

          <div class="info">
            <p><strong>Receipt #:</strong> ${transactionId}</p>
            <p><strong>Date:</strong> ${formatDate(receiptDate)} ${formatTime(receiptDate)}</p>
            <p><strong>Customer:</strong> ${customerName || 'Guest'}</p>
          </div>

          <table>
            <thead>
              <tr>
                <th>Item</th><th>Qty</th><th>Price</th><th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <table class="totals">
             <tr><td class="label">Subtotal</td><td>$${subtotal.toFixed(2)}</td></tr>
             <tr><td class="label">Tax</td><td>$${tax.toFixed(2)}</td></tr>
             <tr><td class="label" style="font-weight: bold;">Total</td><td style="font-weight: bold;">$${total.toFixed(2)}</td></tr>
          </table>

          <div class="payment-info">
            <p><strong>Payment Method:</strong> ${paymentResult.cardDetails?.brand || 'Card'} ${paymentResult.cardDetails?.lastFourDigits ? `ending in ${paymentResult.cardDetails.lastFourDigits}` : ''}</p>
            <p><strong>Status:</strong> ${paymentResult.success ? 'Paid' : 'Failed'}</p>
            ${paymentResult.transactionId ? `<p><strong>Payment ID:</strong> ${paymentResult.transactionId}</p>` : ''}
          </div>

          <div class="info pickup-info" style="margin-top: 10px;">
             <p><strong>Estimated Pickup:</strong> ${formatDate(pickupDate)}</p>
          </div>

          <div class="footer">
            <p>Thank you for your business!</p>
            ${paymentResult.receiptUrl ? `<p><a href="${paymentResult.receiptUrl}" target="_blank">View Online Receipt</a></p>` : ''}
          </div>
        </div>
      </body>
      </html>
    `;

    return receiptHtml;
};

// Save receipt HTML to a file and provide share options
export const saveAndShareReceipt = async (
  receiptHtml: string,
  transactionId: string
): Promise<void> => {
  const filePath = `${RNFS.DocumentDirectoryPath}/receipt_${transactionId}.html`;

  try {
    // Write the HTML string to a file
    await RNFS.writeFile(filePath, receiptHtml, 'utf8');
    console.log('Receipt saved to:', filePath);

    // Use React Native's Share API
    await Share.share({
      title: `Receipt ${transactionId}`,
      url: `file://${filePath}`, // Use the file URL for sharing
      // message: `Here is your receipt ${transactionId}.`, // Optional message
    });

  } catch (error: any) {
    console.error('Error saving or sharing receipt:', error);
    // Optionally, delete the file if sharing failed?
    // await RNFS.unlink(filePath);
    throw new Error('Failed to save or share receipt.'); // Rethrow or handle appropriately
  }
};