// src/store/slices/CustomerSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { generateClient } from "aws-amplify/data";
import { Schema } from "../../../amplify/data/resource";
import type { RootState } from "../index";

const client = generateClient<Schema>();

// Define customer state interface
interface CustomerState {
  customers: Schema["Customer"]["type"][];
  isLoading: boolean;
  error: string | null;
}

// Initial state
const initialState: CustomerState = {
  customers: [],
  isLoading: false,
  error: null,
};

// Helper function to make customer objects serializable by removing functions
const makeSerializable = (customer: any) => {
  if (!customer) return customer;
  
  // Create a new object without the function properties
  const serializedCustomer = {...customer};
  
  // Remove the garments function if it exists
  if (typeof serializedCustomer.garments === "function") {
    delete serializedCustomer.garments;
  }
  
  return serializedCustomer;
};

// Async thunks
export const fetchCustomers = createAsyncThunk(
  "customer/fetchCustomers",
  async (userId: string, { rejectWithValue }) => {
    try {
      const { data, errors } = await client.models.Customer.list({
        filter: { userId: { eq: userId } }
      });

      if (errors) {
        return rejectWithValue(errors[0]?.message || "Failed to fetch customers");
      }
      
      // Make customers serializable before returning
      const serializedCustomers = data.map(makeSerializable);
      return serializedCustomers;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Failed to fetch customers");
    }
  }
);

export const createCustomer = createAsyncThunk(
  "customer/createCustomer",
  async ({ customerData, userId }: { customerData: any, userId: string }, { rejectWithValue }) => {
    try {
      // Remove the valid flag as it's not in the schema
      const { valid, ...cleanCustomerData } = customerData;
      const input = { ...cleanCustomerData, userId };
      
      console.log("Sending to API:", input);
      const { data, errors } = await client.models.Customer.create(input);

      if (errors) {
        return rejectWithValue(errors[0]?.message || "Failed to create customer");
      }
      
      // Make customer serializable before returning
      return makeSerializable(data);
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Failed to create customer");
    }
  }
);

export const updateCustomer = createAsyncThunk(
  "customer/updateCustomer",
  async ({ customerData, userId }: { customerData: any, userId: string }, { rejectWithValue }) => {
    try {
      // Remove the valid flag as it's not in the schema
      const { valid, ...cleanCustomerData } = customerData;
      const input = { ...cleanCustomerData, userId };
      
      console.log("Sending to API for update:", input);
      const { data, errors } = await client.models.Customer.update(input);

      if (errors) {
        return rejectWithValue(errors[0]?.message || "Failed to update customer");
      }
      
      // Make customer serializable before returning
      return makeSerializable(data);
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Failed to update customer");
    }
  }
);

export const deleteCustomer = createAsyncThunk(
  "customer/deleteCustomer",
  async (customerId: string, { rejectWithValue }) => {
    try {
      const { errors } = await client.models.Customer.delete({
        id: customerId
      });

      if (errors) {
        return rejectWithValue(errors[0]?.message || "Failed to delete customer");
      }

      return customerId;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Failed to delete customer");
    }
  }
);

// Customer slice
const CustomerSlice = createSlice({
  name: "customer",
  initialState,
  reducers: {
    clearErrors: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch customers
      .addCase(fetchCustomers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCustomers.fulfilled, (state, action) => {
        state.customers = action.payload;
        state.isLoading = false;
      })
      .addCase(fetchCustomers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Create customer
      .addCase(createCustomer.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createCustomer.fulfilled, (state, action) => {
        state.customers.push(action.payload);
        state.isLoading = false;
      })
      .addCase(createCustomer.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Update customer
      .addCase(updateCustomer.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateCustomer.fulfilled, (state, action) => {
        const index = state.customers.findIndex(c => c.id === action.payload.id);
        if (index !== -1) {
          state.customers[index] = action.payload;
        }
        state.isLoading = false;
      })
      .addCase(updateCustomer.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Delete customer
      .addCase(deleteCustomer.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteCustomer.fulfilled, (state, action) => {
        state.customers = state.customers.filter(c => c.id !== action.payload);
        state.isLoading = false;
      })
      .addCase(deleteCustomer.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  }
});

export const { clearErrors } = CustomerSlice.actions;
export default CustomerSlice.reducer;