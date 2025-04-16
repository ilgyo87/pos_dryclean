// src/store/slices/OrderSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { generateClient } from 'aws-amplify/data';
import { Schema } from '../../../amplify/data/resource';
import type { RootState } from '../index';

const client = generateClient<Schema>();

// Define order state interface
interface OrderState {
  orders: Schema['Order']['type'][];
  currentOrder: Schema['Order']['type'] | null;
  isLoading: boolean;
  error: string | null;
  orderItems: Schema['OrderItem']['type'][];
  orderItemsLoading: boolean;
  orderItemsError: string | null;
}

// Define order item state interface
interface OrderItemState {
  orderItems: Schema['OrderItem']['type'][];
  isLoading: boolean;
  error: string | null;
}

const orderItemInitialState: OrderItemState = {
  orderItems: [],
  isLoading: false,
  error: null,
};

// Initial state
const initialState: OrderState = {
  orders: [],
  currentOrder: null,
  isLoading: false,
  error: null,
  orderItems: [],
  orderItemsLoading: false,
  orderItemsError: null,
};

// Types for order creation
interface OrderItem {
  itemId: string;
  quantity: number;
  price: number;
  type: 'service' | 'product';
  orderId: string;
}

export interface OrderData {
  customerId: string;
  businessId: string;
  items?: OrderItem[]; // Made optional for two-step creation
  subtotal: number;
  tax: number;
  tip: number;
  total: number;
  paymentMethod: string;
  amountTendered: number;
  change: number;
  status: 'CREATED' | 'PROCESSING' | 'READY' | 'COMPLETED' | 'CANCELLED' | 'DELIVERY_SCHEDULED' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'FAILED';
  pickupDate: string;
  notes?: string;
  employeeId?: string;
}

// Helper function to make order objects serializable
const makeSerializable = (order: Partial<Schema['Order']['type']> | null) => {
  if (!order) return order;
  
  // Create a new object without the function properties
  const serializedOrder = {...order};
  
  // Remove any function properties that might be present
  const functionProperties = ['orderItems', 'customer', 'business', 'service', 'employee'];
  
  for (const prop of functionProperties) {
    if (Object.prototype.hasOwnProperty.call(serializedOrder, prop) && typeof (serializedOrder as Record<string, unknown>)[prop] === 'function') {
      delete (serializedOrder as Record<string, unknown>)[prop];
    }
  }
  
  return serializedOrder;
};

// Generate an order number
const generateOrderNumber = (): string => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `ORD-${timestamp}-${random}`;
};

// Async thunks
// ----- ORDERS -----
export const fetchOrders = createAsyncThunk(
  'order/fetchOrders',
  async () => {
    try {
      // Fetch all orders since businessId isn't available as a filter field
      const { data, errors } = await client.models.Order.list();
      console.log('Fetched orders:', data);
      if (errors) {
        return { error: errors[0]?.message || 'Failed to fetch orders' };
      }
      
      return data;
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Failed to fetch orders' };
    }
  }
);

export const fetchOrdersByCustomer = createAsyncThunk(
  'order/fetchOrdersByCustomer',
  async (customerId: string) => {
    try {
      // Fetch all orders since customerId isn't available as a filter field
      const { data, errors } = await client.models.Order.list();

      if (errors) {
        return { error: errors[0]?.message || 'Failed to fetch customer orders' };
      }
      
      // Filter orders by customerId if available
      const filteredData = data?.filter((order: Schema['Order']['type']) => {
        if ((order as any).customerId) {
          return (order as any).customerId === customerId;
        }
        return false;
      });
      
      // Make orders serializable before returning
      const serializedOrders = filteredData?.map(makeSerializable) || [];
      return serializedOrders;
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Failed to fetch customer orders' };
    }
  }
);

export const fetchOrderById = createAsyncThunk(
  'order/fetchOrderById',
  async (orderId: string) => {
    try {
      const { data, errors } = await client.models.Order.get({ id: orderId });

      if (errors) {
        return { error: errors[0]?.message || 'Failed to fetch order' };
      }
      
      // Make order serializable before returning
      return makeSerializable(data);
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Failed to fetch order' };
    }
  }
);

import { createOrderWithItems } from '../../../amplify/data/orderData';

export const createOrder = createAsyncThunk(
  'order/createOrder',
  async (orderData: OrderData) => {
    try {
      // Prepare order input (only allowed fields)
      const orderNumber = generateOrderNumber();

      if (!orderData.customerId) {
        return { error: "customerId is required to create an order." };
      }
      // Construct orderInput directly, setting notes or null, and all required fields
      const orderInput = {
        customerId: orderData.customerId,
        orderNumber: orderNumber,
        orderDate: new Date().toISOString(),
        dueDate: orderData.pickupDate,
        status: orderData.status,
        subtotal: orderData.subtotal,
        tax: orderData.tax,
        tip: orderData.tip,
        total: orderData.total,
        paymentMethod: orderData.paymentMethod,
        amountTendered: orderData.amountTendered,
        change: orderData.change,
        notes: orderData.notes ? [orderData.notes] : [],
        employeeId: orderData.employeeId,
      };

      // 1. Create Order
      const { data: createdOrder, errors: orderErrors } = await client.models.Order.create(orderInput);
      if (orderErrors) {
        return { error: orderErrors[0]?.message || 'Failed to create order' };
      }
      if (!createdOrder?.id) {
        return { error: 'Order creation failed: missing id' };
      }

      // 2. Create OrderItems (one for each item)
      const createdOrderItems = [];
      if (orderData.items) {
        for (const item of orderData.items) {
        const orderItemInput = {
          orderId: createdOrder.id,
          orderNumber: orderNumber,
          quantity: item.quantity,
          price: item.price,
          itemId: item.itemId,
        };
        const { data: createdOrderItem, errors: orderItemErrors } = await client.models.OrderItem.create(orderItemInput);
        if (orderItemErrors) {
          return { error: orderItemErrors[0]?.message || 'Failed to create order item' };
        }
        createdOrderItems.push(createdOrderItem);
      }
    }

      return { order: createdOrder, orderItems: createdOrderItems };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Failed to create order' };
    }
  }
);

export const fetchOrderItemsCount = createAsyncThunk(
  'order/fetchOrderItemsCount',
  async (orderId: string) => {
    try {
      // Fetch order items for the given order ID
      const { data, errors } = await client.models.OrderItem.list({
        filter: { orderId: { eq: orderId } }
      });

      if (errors) {
        return { error: errors[0]?.message || 'Failed to fetch order items' };
      }
      
      // Return the count of items
      return data?.length || 0;
    } catch (error) {
      console.error('Error fetching order items count:', error);
      return { error: error instanceof Error ? error.message : 'Failed to fetch order items count' };
    }
  }
);

export const updateOrderStatus = createAsyncThunk(
  'order/updateOrderStatus',
  async ({ 
    orderId, 
    status,
    employeeId
  }: { 
    orderId: string, 
    status: 'CREATED' | 'PROCESSING' | 'READY' | 'COMPLETED' | 'CANCELLED' | 'DELIVERY_SCHEDULED' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'FAILED',
    employeeId?: string
  }) => {
    try {
      const updateInput = {
        id: orderId,
        status: status as 'CREATED' | 'PROCESSING' | 'READY' | 'COMPLETED' | 'CANCELLED' | 'DELIVERY_SCHEDULED' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'FAILED',
        employeeId
      };
      
      const { data, errors } = await client.models.Order.update(updateInput);
      
      if (errors) {
        return { error: errors[0]?.message || 'Failed to update order status' };
      }
      
      return makeSerializable(data);
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Failed to update order status' };
    }
  }
);

// ----- ORDER ITEMS -----
export const fetchOrderItems = createAsyncThunk(
  'orderItem/fetchOrderItems',
  async (orderId: string) => {
    try {
      const { data, errors } = await client.models.OrderItem.list({ filter: { orderId: { eq: orderId } } });
      if (errors) {
        return { error: errors[0]?.message || 'Failed to fetch order items' };
      }
      return data || [];
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Failed to fetch order items' };
    }
  }
);

// Order slice
const orderSlice = createSlice({
  name: 'order',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // ...other order thunks

    // Fetch Order Items
    builder
      .addCase(fetchOrderItems.pending, (state) => {
        state.orderItemsLoading = true;
        state.orderItemsError = null;
      })
      .addCase(fetchOrderItems.fulfilled, (state, action) => {
        // If the payload is an error object, do not assign to orderItems
        if (Array.isArray(action.payload)) {
          state.orderItems = action.payload;
          state.orderItemsError = null;
        } else if (action.payload && typeof action.payload === 'object' && 'error' in action.payload) {
          state.orderItemsError = action.payload.error;
          state.orderItems = [];
        } else {
          state.orderItems = [];
          state.orderItemsError = 'Unknown error fetching order items';
        }
        state.orderItemsLoading = false;
      })
      .addCase(fetchOrderItems.rejected, (state, action) => {
        state.orderItemsLoading = false;
        state.orderItemsError = action.error.message || 'Failed to fetch order items';
        state.orderItems = [];
      });
    // Optionally handle create/update/deleteOrderItem thunks here as well
  },
});

export default orderSlice.reducer;

// Use explicit required fields for OrderItem creation, matching Amplify schema
type CreateOrderItemInput = {
  orderId: string;
  orderNumber: string;
  price: number;
  quantity: number;
  // Add any other required fields from your schema here
  [key: string]: any;
};

export const createOrderItem = createAsyncThunk(
  'orderItem/createOrderItem',
  async (orderItemData: CreateOrderItemInput) => {
    try {
      const { data, errors } = await client.models.OrderItem.create(orderItemData);
      if (errors) {
        return { error: errors[0]?.message || 'Failed to create order item' };
      }
      return data;
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Failed to create order item' };
    }
  }
);

// Use explicit required fields for OrderItem update, matching Amplify schema
type UpdateOrderItemInput = {
  id: string;
  // Optionally, price, quantity, etc. (but id is always required for update)
  [key: string]: any;
};

export const updateOrderItem = createAsyncThunk(
  'orderItem/updateOrderItem',
  async (orderItemData: UpdateOrderItemInput) => {
    try {
      const { data, errors } = await client.models.OrderItem.update(orderItemData);
      if (errors) {
        return { error: errors[0]?.message || 'Failed to update order item' };
      }
      return data;
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Failed to update order item' };
    }
  }
);

export const deleteOrderItem = createAsyncThunk(
  'orderItem/deleteOrderItem',
  async (orderItemId: string) => {
    try {
      const { errors } = await client.models.OrderItem.delete({ id: orderItemId });
      if (errors) {
        return { error: errors[0]?.message || 'Failed to delete order item' };
      }
      return orderItemId;
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Failed to delete order item' };
    }
  }
);
