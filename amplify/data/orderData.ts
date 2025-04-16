// amplify/data/orderData.ts
// Helper for creating an order and its order items, matching the pattern in stockData.ts
import type { Schema } from "./resource";

/**
 * Creates an order and its associated order items, ensuring all orderItems are linked to the created orderId.
 * @param createOrder Function to create an Order
 * @param createOrderItem Function to create an OrderItem
 * @param orderData The order fields (excluding orderId)
 * @param orderItemsData Array of order item fields (excluding orderId)
 * @returns The created order and an array of created order items
 */
export const createOrderWithItems = async (
  createOrder: (data: Partial<Schema["Order"]["type"]>) => Promise<any>,
  createOrderItem: (data: Partial<Schema["OrderItem"]["type"]>) => Promise<any>,
  orderData: Partial<Schema["Order"]["type"]>,
  orderItemsData: Array<Partial<Schema["OrderItem"]["type"]>>
): Promise<{ order: any; orderItems: any[] }> => {
  // Create the order first
  const order = await createOrder(orderData);
  if (!order || !order.id) {
    throw new Error("Failed to create order or missing order ID");
  }
  // Create each order item, assigning the correct orderId
  const createdOrderItems = [];
  for (const item of orderItemsData) {
    const orderItem = await createOrderItem({ ...item, orderId: order.id });
    createdOrderItems.push(orderItem);
  }
  return { order, orderItems: createdOrderItems };
};
