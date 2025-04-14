// src/store/slices/ItemSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { generateClient } from 'aws-amplify/data';
import { Schema } from '../../../amplify/data/resource';
import type { RootState } from '../index';

const client = generateClient<Schema>();

// Define item state interface
interface ItemState {
  items: Schema['Item']['type'][];
  isLoading: boolean;
  error: string | null;
}

// Initial state
const initialState: ItemState = {
  items: [],
  isLoading: false,
  error: null,
};

// Helper function to make item objects serializable
const makeSerializable = (item: any) => {
  if (!item) return item;
  
  // Create a new object without the function properties
  const serializedItem = {...item};
  
  // Remove any function properties if they exist
  if (typeof serializedItem.category === 'function') {
    delete serializedItem.category;
  }
  
  return serializedItem;
};

// Async thunks
export const fetchItems = createAsyncThunk(
  'item/fetchItems',
  async (categoryId: string | null, { rejectWithValue }) => {
    try {
      // If categoryId is null, return empty array
      if (!categoryId) {
        return [];
      }
      
      const { data, errors } = await client.models.Item.list({
        filter: { categoryId: { eq: categoryId } }
      });

      if (errors) {
        return rejectWithValue(errors[0]?.message || 'Failed to fetch items');
      }
      
      // Make items serializable before returning
      const serializedItems = data.map(makeSerializable);
      return serializedItems;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch items');
    }
  }
);

export const createItem = createAsyncThunk(
  'item/createItem',
  async (itemData: any, { rejectWithValue }) => {
    try {
      // Validate required fields
      if (!itemData.name) {
        return rejectWithValue('Item name is required');
      }
      
      if (!itemData.categoryId) {
        return rejectWithValue('Category ID is required');
      }
      
      if (itemData.price === undefined || itemData.price === null) {
        return rejectWithValue('Price is required');
      }
      
      const { data, errors } = await client.models.Item.create(itemData);

      if (errors) {
        return rejectWithValue(errors[0]?.message || 'Failed to create item');
      }
      
      // Make item serializable before returning
      return makeSerializable(data);
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to create item');
    }
  }
);

export const updateItem = createAsyncThunk(
  'item/updateItem',
  async (itemData: any, { rejectWithValue }) => {
    try {
      // Validate ID and required fields
      if (!itemData.id) {
        return rejectWithValue('Item ID is required for update');
      }
      
      if (!itemData.name) {
        return rejectWithValue('Item name is required');
      }
      
      if (itemData.price === undefined || itemData.price === null) {
        return rejectWithValue('Price is required');
      }
      
      const { data, errors } = await client.models.Item.update(itemData);

      if (errors) {
        return rejectWithValue(errors[0]?.message || 'Failed to update item');
      }
      
      // Make item serializable before returning
      return makeSerializable(data);
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to update item');
    }
  }
);

export const deleteItem = createAsyncThunk(
  'item/deleteItem',
  async (itemId: string, { rejectWithValue }) => {
    try {
      const { errors } = await client.models.Item.delete({
        id: itemId
      });

      if (errors) {
        return rejectWithValue(errors[0]?.message || 'Failed to delete item');
      }

      return itemId;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to delete item');
    }
  }
);

// Item slice
const ItemSlice = createSlice({
  name: 'item',
  initialState,
  reducers: {
    clearErrors: (state) => {
      state.error = null;
    },
    clearItems: (state) => {
      state.items = [];
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch items
      .addCase(fetchItems.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchItems.fulfilled, (state, action) => {
        state.items = action.payload;
        state.isLoading = false;
      })
      .addCase(fetchItems.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Create item
      .addCase(createItem.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createItem.fulfilled, (state, action) => {
        state.items.push(action.payload);
        state.isLoading = false;
      })
      .addCase(createItem.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Update item
      .addCase(updateItem.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateItem.fulfilled, (state, action) => {
        const index = state.items.findIndex(i => i.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
        state.isLoading = false;
      })
      .addCase(updateItem.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Delete item
      .addCase(deleteItem.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteItem.fulfilled, (state, action) => {
        state.items = state.items.filter(i => i.id !== action.payload);
        state.isLoading = false;
      })
      .addCase(deleteItem.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  }
});

export const { clearErrors, clearItems } = ItemSlice.actions;
export default ItemSlice.reducer;