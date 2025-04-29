// src/utils/OrderBarcodeUtils.ts
import { Order, Product } from '../types';
import { updateOrderStatus } from '../localdb/services/orderService';

/**
 * Update order status and related items after barcode scanning
 * @param orderId The ID of the order to update
 * @param updatedItems The updated items with new status
 * @param newStatus The new status to set on the order
 * @param employeeName Optional employee name for tracking who made the change
 */
export async function updateOrderAfterTicketing(
  orderId: string, 
  updatedItems: Product[], 
  newStatus: string = 'PROCESSING',
  employeeName?: string
): Promise<boolean> {
  try {
    // Create note about status change
    const now = new Date();
    const formattedDate = now.toLocaleString();
    const note = `Status changed to ${newStatus} via barcode ticketing${employeeName ? ` by ${employeeName}` : ''} at ${formattedDate}`;
    
    // Update order status in database with note
    await updateOrderStatus(orderId, newStatus, note);
    
    console.log(`[OrderBarcodeUtils] Updated order ${orderId} status to ${newStatus}`);
    return true;
  } catch (error) {
    console.error(`[OrderBarcodeUtils] Error updating order status:`, error);
    return false;
  }
}

/**
 * Generate a barcode value from customer ID and product ID
 * @param customerId The customer ID
 * @param productId The product ID
 * @returns A formatted barcode string
 */
export function generateBarcodeValue(customerId: string, productId: string): string {
  return `${customerId}_${productId}`;
}

/**
 * Parse a barcode value into customer ID and product ID
 * @param barcodeValue The scanned barcode value
 * @returns Object with customerID and productId, or null if invalid format
 */
export function parseBarcodeValue(barcodeValue: string): { customerId: string; productId: string } | null {
  // Format is customerId_productId
  const parts = barcodeValue.split('_');
  
  if (parts.length !== 2) {
    return null;
  }
  
  const [customerId, productId] = parts;
  
  if (!customerId || !productId) {
    return null;
  }
  
  return { customerId, productId };
}

/**
 * Find a product in an order by product ID
 * @param items List of products in the order
 * @param productId Product ID to find
 * @returns The found product or undefined
 */
export function findProductInOrder(items: Product[], productId: string): Product | undefined {
  return items.find(item => item._id === productId);
}

/**
 * Check if all items in an order have been ticketed
 * @param items List of products in the order 
 * @param ticketedItemIds Set of ticketed product IDs
 * @returns True if all items are ticketed
 */
export function areAllItemsTicketed(items: Product[], ticketedItemIds: Set<string>): boolean {
  return items.every(item => ticketedItemIds.has(item._id));
}