// src/store/slices/BusinessSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { generateClient } from 'aws-amplify/data';
import { Schema } from '../../../amplify/data/resource';
import type { RootState } from '../index';

const client = generateClient<Schema>();

// Define business state interface
interface BusinessState {
  businesses: Schema['Business']['type'][];
  isLoading: boolean;
  error: string | null;
}

// Initial state
const initialState: BusinessState = {
  businesses: [],
  isLoading: false,
  error: null,
};

// Helper function to make business objects serializable by removing functions
const makeSerializable = (business: any) => {
  if (!business) return business;
  
  // Create a new object without the function properties
  const serializedBusiness = {...business};
  
  // Remove functions if they exist
  if (typeof serializedBusiness.businessMetrics === 'function') {
    delete serializedBusiness.businessMetrics;
  }
  
  return serializedBusiness;
};

// Async thunks
export const fetchBusinesses = createAsyncThunk(
  'business/fetchBusinesses',
  async (userId: string, { rejectWithValue }) => {
    try {
      const { data, errors } = await client.models.Business.list({
        filter: { userId: { eq: userId } }
      });

      if (errors) {
        return rejectWithValue(errors[0]?.message || 'Failed to fetch businesses');
      }
      
      // Make businesses serializable before returning
      const serializedBusinesses = data.map(makeSerializable);
      return serializedBusinesses;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch businesses');
    }
  }
);

export const createBusiness = createAsyncThunk(
  'business/createBusiness',
  async ({ businessData, userId }: { businessData: any, userId: string }, { rejectWithValue }) => {
    try {
      // Validate required fields
      if (!businessData.name || !businessData.phoneNumber) {
        return rejectWithValue('Business name and phone number are required');
      }
      
      // Remove the valid flag as it's not in the schema
      const { valid, ...cleanBusinessData } = businessData;
      const input = { ...cleanBusinessData, userId };
      
      console.log('Sending to API:', input);
      const { data, errors } = await client.models.Business.create(input);

      if (errors) {
        return rejectWithValue(errors[0]?.message || 'Failed to create business');
      }
      
      // Make business serializable before returning
      return makeSerializable(data);
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to create business');
    }
  }
);

export const updateBusiness = createAsyncThunk(
  'business/updateBusiness',
  async ({ businessData, userId }: { businessData: any, userId: string }, { rejectWithValue }) => {
    try {
      // Validate ID and required fields
      if (!businessData.id) {
        return rejectWithValue('Business ID is required for update');
      }
      
      if (!businessData.name || !businessData.phoneNumber) {
        return rejectWithValue('Business name and phone number are required');
      }
      
      // Remove the valid flag as it's not in the schema
      const { valid, ...cleanBusinessData } = businessData;
      const input = { ...cleanBusinessData, userId };
      
      console.log('Sending to API for update:', input);
      const { data, errors } = await client.models.Business.update(input);

      if (errors) {
        return rejectWithValue(errors[0]?.message || 'Failed to update business');
      }
      
      // Make business serializable before returning
      return makeSerializable(data);
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to update business');
    }
  }
);

export const deleteBusiness = createAsyncThunk(
  'business/deleteBusiness',
  async (businessId: string, { rejectWithValue }) => {
    try {
      const { errors } = await client.models.Business.delete({
        id: businessId
      });

      if (errors) {
        return rejectWithValue(errors[0]?.message || 'Failed to delete business');
      }

      return businessId;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to delete business');
    }
  }
);

// Business slice
const BusinessSlice = createSlice({
  name: 'business',
  initialState,
  reducers: {
    clearErrors: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch businesses
      .addCase(fetchBusinesses.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchBusinesses.fulfilled, (state, action) => {
        state.businesses = action.payload;
        state.isLoading = false;
      })
      .addCase(fetchBusinesses.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Create business
      .addCase(createBusiness.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createBusiness.fulfilled, (state, action) => {
        state.businesses.push(action.payload);
        state.isLoading = false;
      })
      .addCase(createBusiness.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Update business
      .addCase(updateBusiness.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateBusiness.fulfilled, (state, action) => {
        const index = state.businesses.findIndex(b => b.id === action.payload.id);
        if (index !== -1) {
          state.businesses[index] = action.payload;
        }
        state.isLoading = false;
      })
      .addCase(updateBusiness.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Delete business
      .addCase(deleteBusiness.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteBusiness.fulfilled, (state, action) => {
        state.businesses = state.businesses.filter(b => b.id !== action.payload);
        state.isLoading = false;
      })
      .addCase(deleteBusiness.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  }
});

export const { clearErrors } = BusinessSlice.actions;
export default BusinessSlice.reducer;