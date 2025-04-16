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
}

// Initial state
const initialState: OrderState = {
  orders: [],
  currentOrder: null,
  isLoading: false,
  error: null,
};

// Types for order creation
interface OrderItem {
  itemId: string;
  quantity: number;
  price: number;
  type: 'service' | 'product';
  serviceId?: string;
}

interface OrderData {
  customerId: string;
  businessId: string;
  items: OrderItem[];
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
const makeSerializable = (order: any) => {
  if (!order) return order;
  
  // Create a new object without the function properties
  const serializedOrder = {...order};
  
  // Remove any function properties that might be present
  const functionProperties = ['orderItems', 'customer', 'business', 'service', 'employee'];
  
  for (const prop of functionProperties) {
    if (typeof serializedOrder[prop] === 'function') {
      delete serializedOrder[prop];
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
export const fetchOrders = createAsyncThunk(
  'order/fetchOrders',
  async (businessId: string, { rejectWithValue }) => {
    try {
      // Fetch all orders since businessId isn't available as a filter field
      const { data, errors } = await client.models.Order.list();

      if (errors) {
        return rejectWithValue(errors[0]?.message || 'Failed to fetch orders');
      }
      
      // Filter orders by businessId if available
      // Since the Order model doesn't have a businessId field in the TypeScript types,
      // we use a type assertion to access it if it exists at runtime
      const filteredData = data?.filter(order => {
        // Use a type assertion to safely check for businessId
        const orderAny = order as any;
        
        // If the order has a businessId property, use it for filtering
        if (orderAny.businessId) {
          return orderAny.businessId === businessId;
        }
        
        // No filtering criteria available, include all orders for now
        // You may want to adjust this based on your application requirements
        return true;
      });
      
      // Make orders serializable before returning
      const serializedOrders = filteredData?.map(makeSerializable) || [];      
      return serializedOrders;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch orders');
    }
  }
);

export const fetchOrdersByCustomer = createAsyncThunk(
  'order/fetchOrdersByCustomer',
  async (customerId: string, { rejectWithValue }) => {
    try {
      // Fetch all orders since customerId isn't available as a filter field
      const { data, errors } = await client.models.Order.list();

      if (errors) {
        return rejectWithValue(errors[0]?.message || 'Failed to fetch customer orders');
      }
      
      // Filter orders by customerId if available
      const filteredData = data?.filter(order => {
        // Use a type assertion to safely check for customerId
        const orderAny = order as any;
        
        // If the order has a customerId property, use it for filtering
        if (orderAny.customerId) {
          return orderAny.customerId === customerId;
        }
        
        return false;
      });
      
      // Make orders serializable before returning
      const serializedOrders = filteredData?.map(makeSerializable) || [];
      return serializedOrders;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch customer orders');
    }
  }
);

export const fetchOrderById = createAsyncThunk(
  'order/fetchOrderById',
  async (orderId: string, { rejectWithValue }) => {
    try {
      const { data, errors } = await client.models.Order.get({ id: orderId });

      if (errors) {
        return rejectWithValue(errors[0]?.message || 'Failed to fetch order');
      }
      
      // Make order serializable before returning
      return makeSerializable(data);
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch order');
    }
  }
);

import { createOrderWithItems } from '../../../amplify/data/orderData';

export const createOrder = createAsyncThunk(
  'order/createOrder',
  async (orderData: OrderData, { rejectWithValue }) => {
    try {
      // Prepare order input (only allowed fields)
      const orderNumber = generateOrderNumber();
      // Utility to remove undefined fields
      function cleanInput<T extends object>(input: T): Partial<T> {
        return Object.fromEntries(
          Object.entries(input).filter(([_, v]) => v !== undefined)
        ) as Partial<T>;
      }

      if (!orderData.customerId) {
        return rejectWithValue("customerId is required to create an order.");
      }
      // Construct orderInput directly, setting notes or null, and all required fields
      const orderInput = {
        orderNumber,
        orderDate: new Date().toISOString(),
        status: orderData.status,
        pickupDate: orderData.pickupDate,
        customerId: orderData.customerId,
        notes: orderData.notes ? [orderData.notes] : null,
        employeeId: orderData.employeeId,
        subtotal: orderData.subtotal,
        tax: orderData.tax,
        tip: orderData.tip,
        total: orderData.total,
        paymentMethod: orderData.paymentMethod,
        amountTendered: orderData.amountTendered,
        change: orderData.change
        // Add more fields as needed from your schema, but do not include 'items'
      };


      // Prepare order items input (exclude orderId)
      const orderItemsInput = orderData.items.map(item => cleanInput({
        itemId: item.itemId,
        quantity: item.quantity,
        price: item.price,
        type: item.type,
        serviceId: item.serviceId
        // Add more fields as needed
      }));

      // Use the helper to create order and items
      const { order, orderItems } = await createOrderWithItems(
        async (data) => {
          const { data: created, errors } = await client.models.Order.create(data as any);
          if (errors) throw new Error(errors[0]?.message || 'Order creation failed');
          return created;
        },
        async (data) => {
          const { data: created, errors } = await client.models.OrderItem.create(data as any);
          if (errors) throw new Error(errors[0]?.message || 'OrderItem creation failed');
          return created;
        },
        orderInput,
        orderItemsInput
      );

      // Return the created order
      return makeSerializable(order);

    } catch (error) {
      console.error('Error in createOrder thunk:', error);
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to create order');
    }
  }
);

export const fetchOrderItemsCount = createAsyncThunk(
  'order/fetchOrderItemsCount',
  async (orderId: string, { rejectWithValue }) => {
    try {
      // Fetch order items for the given order ID
      const { data, errors } = await client.models.OrderItem.list({
        filter: { orderId: { eq: orderId } }
      });

      if (errors) {
        return rejectWithValue(errors[0]?.message || 'Failed to fetch order items');
      }
      
      // Return the count of items
      return data?.length || 0;
    } catch (error) {
      console.error('Error fetching order items count:', error);
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch order items count');
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
  }, { rejectWithValue }) => {
    try {
      const updateInput = {
        id: orderId,
        status: status as 'CREATED' | 'PROCESSING' | 'READY' | 'COMPLETED' | 'CANCELLED' | 'DELIVERY_SCHEDULED' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'FAILED',
        employeeId
      };
      
      const { data, errors } = await client.models.Order.update(updateInput);
      
      if (errors) {
        return rejectWithValue(errors[0]?.message || 'Failed to update order status');
      }
      
      return makeSerializable(data);
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to update order status');
    }
  }
);

// Create the order slice
const OrderSlice = createSlice({
  name: 'order',
  initialState,
  reducers: {
    clearErrors: (state) => {
      state.error = null;
    },
    clearCurrentOrder: (state) => {
      state.currentOrder = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch orders
      .addCase(fetchOrders.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.orders = action.payload;
        state.isLoading = false;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Fetch orders by customer
      .addCase(fetchOrdersByCustomer.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchOrdersByCustomer.fulfilled, (state, action) => {
        state.orders = action.payload;
        state.isLoading = false;
      })
      .addCase(fetchOrdersByCustomer.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Fetch order by ID
      .addCase(fetchOrderById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchOrderById.fulfilled, (state, action) => {
        state.currentOrder = action.payload;
        state.isLoading = false;
      })
      .addCase(fetchOrderById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Create order
      .addCase(createOrder.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.orders.unshift(action.payload);
        state.currentOrder = action.payload;
        state.isLoading = false;
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Update order status
      .addCase(updateOrderStatus.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        state.currentOrder = action.payload;
        
        // Also update the order in the orders array
        const index = state.orders.findIndex(order => order.id === action.payload.id);
        if (index !== -1) {
          state.orders[index] = action.payload;
        }
        
        state.isLoading = false;
      })
      .addCase(updateOrderStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  }
});

export const { clearErrors, clearCurrentOrder } = OrderSlice.actions;
export default OrderSlice.reducer;