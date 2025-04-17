// src/store/slices/OrderSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { generateClient } from 'aws-amplify/data';
import { Schema } from '../../../amplify/data/resource';
import type { RootState } from '../index';

const client = generateClient<Schema>();

// Define order state interface
interface OrderState {
  orders: any[]; // Using 'any' to avoid type conflicts with Amplify client
  currentOrder: any | null;
  isLoading: boolean;
  error: string | null;
  orderItems: any[];
  orderItemsLoading: boolean;
  orderItemsError: string | null;
}

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
  price: number;
  type: 'service' | 'product';
  orderId: string;
}

export interface OrderData {
  customerId: string;
  businessId: string;
  firstName: string;
  lastName: string;
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
const makeSerializable = (order: any) => {
  if (!order) return order;
  
  // Create a new object without the function properties
  const serializedOrder = {...order};
  
  // Remove any function properties that might be present
  const functionProperties = ['orderItems', 'customer', 'business', 'service', 'employee'];
  
  for (const prop of functionProperties) {
    if (Object.prototype.hasOwnProperty.call(serializedOrder, prop) && typeof serializedOrder[prop] === 'function') {
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
// ----- ORDERS -----
export const fetchOrders = createAsyncThunk(
  'order/fetchOrders',
  async (_, { rejectWithValue }) => {
    try {
      console.log('Fetching all orders...');
      // Fetch all orders
      const { data, errors } = await client.models.Order.list();
      
      if (errors) {
        console.error('Errors fetching orders:', errors);
        return rejectWithValue(errors[0]?.message || 'Failed to fetch orders');
      }
      
      if (!data || data.length === 0) {
        console.log('No orders found');
        return [];
      }
      
      console.log(`Successfully fetched ${data.length} orders`);
      
      // Make orders serializable
      const serializedOrders = data.map(makeSerializable) || [];
      return serializedOrders;
    } catch (error) {
      console.error('Error in fetchOrders:', error);
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch orders');
    }
  }
);

export const fetchOrdersByCustomer = createAsyncThunk(
  'order/fetchOrdersByCustomer',
  async (customerId: string, { rejectWithValue }) => {
    try {
      // Fetch all orders - we filter on the client side because customerId isn't available as a filter field
      const { data, errors } = await client.models.Order.list();

      if (errors) {
        return rejectWithValue(errors[0]?.message || 'Failed to fetch customer orders');
      }
      
      // Filter orders by customerId 
      const filteredData = data?.filter((order: any) => {
        return order.customerId === customerId;
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

export const createOrder = createAsyncThunk(
  'order/createOrder',
  async (orderData: OrderData, { rejectWithValue }) => {
    try {
      // Generate a unique order number
      const orderNumber = generateOrderNumber();
      console.log('Creating new order with number:', orderNumber);

      if (!orderData.customerId) {
        return rejectWithValue("customerId is required to create an order.");
      }
      
      // Create order input object with required fields
      const orderInput: any = {
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
        firstName: orderData.firstName,
        lastName: orderData.lastName,
        employeeId: orderData.employeeId
      };
      
      // Create Order using the client API
      const { data: createdOrder, errors: orderErrors } = await client.models.Order.create(orderInput);
      
      if (orderErrors) {
        console.error('Order creation errors:', orderErrors);
        return rejectWithValue(orderErrors[0]?.message || 'Failed to create order');
      }
      
      if (!createdOrder?.id) {
        console.error('Order created but missing ID');
        return rejectWithValue('Order creation failed: missing id');
      }
      
      console.log('Order created successfully:', createdOrder.id);
      
      // Return the created order
      return { 
        order: makeSerializable(createdOrder), 
        orderItems: [] // Initially empty, items will be added separately
      };
    } catch (error) {
      console.error('Error in createOrder:', error);
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to create order');
    }
  }
);

export const fetchOrderItemsCount = createAsyncThunk(
  'order/fetchOrderItemsCount',
  async (orderId: string, { rejectWithValue }) => {
    if (!orderId) {
      return rejectWithValue('OrderId is required');
    }
    
    try {
      console.log('Fetching order items for:', orderId);
      // Fetch order items for the given order ID
      const { data, errors } = await client.models.OrderItem.list({
        filter: { orderId: { eq: orderId } }
      });

      if (errors) {
        console.error('Errors fetching order items:', errors);
        return rejectWithValue(errors[0]?.message || 'Failed to fetch order items');
      }
      
      // Return the count of items
      const count = data?.length || 0;
      console.log(`Found ${count} items for order ${orderId}`);
      return count;
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
      console.log(`Updating order ${orderId} status to ${status}`);
      
      // Create update input with required fields
      const updateInput: any = {
        id: orderId,
        status: status,
      };
      
      // Add employeeId if provided
      if (employeeId) {
        updateInput.employeeId = employeeId;
      }
      
      const { data, errors } = await client.models.Order.update(updateInput);
      
      if (errors) {
        console.error('Errors updating order status:', errors);
        return rejectWithValue(errors[0]?.message || 'Failed to update order status');
      }
      
      console.log('Order status updated successfully');
      return makeSerializable(data);
    } catch (error) {
      console.error('Error in updateOrderStatus:', error);
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to update order status');
    }
  }
);

// ----- ORDER ITEMS -----
export const fetchOrderItems = createAsyncThunk(
  'orderItem/fetchOrderItems',
  async (orderId: string, { rejectWithValue }) => {
    try {
      console.log('Fetching items for order:', orderId);
      const { data, errors } = await client.models.OrderItem.list({ 
        filter: { orderId: { eq: orderId } } 
      });
      
      if (errors) {
        console.error('Errors fetching order items:', errors);
        return rejectWithValue(errors[0]?.message || 'Failed to fetch order items');
      }
      
      console.log(`Found ${data?.length || 0} items for order ${orderId}`);
      return data || [];
    } catch (error) {
      console.error('Error in fetchOrderItems:', error);
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch order items');
    }
  }
);

// Order slice
const orderSlice = createSlice({
  name: 'order',
  initialState,
  reducers: {
    clearOrderError: (state) => {
      state.error = null;
    },
    clearCurrentOrder: (state) => {
      state.currentOrder = null;
    }
  },
  extraReducers: (builder) => {
    // Fetch Orders
    builder
      .addCase(fetchOrders.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.orders = action.payload || [];
        state.isLoading = false;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string || action.error.message || 'Failed to fetch orders';
      })
    
    // Fetch Order By ID
    builder
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
        state.error = action.payload as string || action.error.message || 'Failed to fetch order';
      })
    
    // Create Order
    builder
      .addCase(createOrder.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        if (action.payload?.order) {
          state.orders.push(action.payload.order);
          state.currentOrder = action.payload.order;
        }
        state.isLoading = false;
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string || action.error.message || 'Failed to create order';
      })
    
    // Update Order Status
    builder
      .addCase(updateOrderStatus.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        if (action.payload) {
          // Update in orders array
          const index = state.orders.findIndex(order => order.id === action.payload?.id);
          if (index !== -1) {
            state.orders[index] = action.payload;
          }
          
          // Update current order if it's the same one
          if (state.currentOrder?.id === action.payload.id) {
            state.currentOrder = action.payload;
          }
        }
        state.isLoading = false;
      })
      .addCase(updateOrderStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string || action.error.message || 'Failed to update order status';
      })

    // Fetch Order Items
    builder
      .addCase(fetchOrderItems.pending, (state) => {
        state.orderItemsLoading = true;
        state.orderItemsError = null;
      })
      .addCase(fetchOrderItems.fulfilled, (state, action) => {
        state.orderItems = Array.isArray(action.payload) ? action.payload : [];
        state.orderItemsLoading = false;
      })
      .addCase(fetchOrderItems.rejected, (state, action) => {
        state.orderItemsLoading = false;
        state.orderItemsError = action.payload as string || action.error.message || 'Failed to fetch order items';
      });
  }
});

export const { clearOrderError, clearCurrentOrder } = orderSlice.actions;
export default orderSlice.reducer;

// Use explicit required fields for OrderItem creation, matching Amplify schema
interface CreateOrderItemInput {
  orderId: string;
  orderNumber: string;
  price: number;
  itemName?: string;
  starch?: 'NONE' | 'LIGHT' | 'MEDIUM' | 'HEAVY';
  pressOnly?: boolean;
}

// Update the createOrderItem function in OrderSlice.ts to properly serialize the response:

export const createOrderItem = createAsyncThunk(
  'orderItem/createOrderItem',
  async (orderItemData: any, { rejectWithValue }) => {
    try {
      console.log('Creating order item:', JSON.stringify(orderItemData, null, 2));
      
      // Validate required fields for the schema
      if (!orderItemData.orderId || !orderItemData.orderNumber || 
          orderItemData.price === undefined) {
        return rejectWithValue('Missing required fields for OrderItem');
      }
      
      // Only include fields defined in your schema, including itemName, starch, pressOnly
      const cleanedData: CreateOrderItemInput = {
        orderId: orderItemData.orderId,
        orderNumber: orderItemData.orderNumber,
        price: orderItemData.price,
        itemName: orderItemData.itemName,
        starch: orderItemData.starch,
        pressOnly: orderItemData.pressOnly
      };
      
      const { data, errors } = await client.models.OrderItem.create(cleanedData);
      
      if (errors) {
        console.error('Errors creating order item:', errors);
        return rejectWithValue(errors[0]?.message || 'Failed to create order item');
      }
      
      // Create a serializable version of the response
      // This prevents the [Function anonymous] serialization error
      const serializableData = { ...data };
      
      // Remove any function properties
      for (const key in serializableData) {
        if (typeof serializableData[key as keyof typeof serializableData] === 'function') {
          delete serializableData[key as keyof typeof serializableData];
        }
      }
      
      console.log('Order item created successfully:', serializableData.id);
      return serializableData;
    } catch (error) {
      console.error('Error in createOrderItem:', error);
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to create order item');
    }
  }
);
// Use explicit required fields for OrderItem update, matching Amplify schema
interface UpdateOrderItemInput {
  id: string;
  orderId: string;
  orderNumber: string;
  price: number;
  itemId?: string;
  __typename: "OrderItem";
  [key: string]: any;
}

export const updateOrderItem = createAsyncThunk(
  'orderItem/updateOrderItem',
  async (orderItemData: UpdateOrderItemInput, { rejectWithValue }) => {
    try {
      const { data, errors } = await client.models.OrderItem.update(orderItemData);
      if (errors) {
        return rejectWithValue(errors[0]?.message || 'Failed to update order item');
      }
      return data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to update order item');
    }
  }
);

export const deleteOrderItem = createAsyncThunk(
  'orderItem/deleteOrderItem',
  async (orderItemId: string, { rejectWithValue }) => {
    try {
      const { errors } = await client.models.OrderItem.delete({ id: orderItemId });
      if (errors) {
        return rejectWithValue(errors[0]?.message || 'Failed to delete order item');
      }
      return orderItemId;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to delete order item');
    }
  }
);