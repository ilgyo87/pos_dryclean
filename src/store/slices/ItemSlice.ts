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
      
      // Make items serializable and ensure imageSource is properly set
      const enhancedItems = data.map(item => {
        // Check if this item already has an imageSource in our Redux state
        // This ensures we don't lose the imageSource when re-fetching items
        const baseItem = makeSerializable(item);
        
        // First check if there's an existing imageSource in the database item
        if (baseItem.imageSource) {
          console.log(`Item ${item.id} already has imageSource: ${baseItem.imageSource}`);
          return baseItem;
        }
        
        // Item name for analysis
        const itemName = item.name?.toLowerCase() || '';
        
        // Directly assign imageSource based on slugified item name, fallback to 'tshirt' if not found
        const slugify = (str: string) => str.toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
        const candidate = slugify(item.name || '');
        // imageAssets is only available in utils, so just assign the key; fallback logic is handled in getImageSource
        return {
          ...baseItem,
          imageSource: candidate || 'tshirt',
        };

      });
      
      // Log a summary instead of the full items array (which could be large)
      console.log(`Fetched and enhanced ${enhancedItems.length} items`);
      enhancedItems.forEach(item => {
        console.log(`Item ${item.id}: ${item.name}, imageSource: ${item.imageSource}`);
      });
      return enhancedItems;
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

      // Store the original imageSource for adding to Redux state later
      const originalImageSource = itemData.imageSource;
      console.log('Original imageSource for UI:', originalImageSource);
      
      // Only remove 'valid' field; save all other fields as provided
      const { valid, ...directData } = itemData;
      console.log('Saving itemData directly to API:', directData);
      
      try {
        // Use a straightforward create approach
        const createResult = await client.models.Item.create(directData);
        
        console.log('Create result:', createResult);
        
        if (!createResult.data) {
          console.error('Failed to create item, no data returned');
          return rejectWithValue('Failed to create item');
        }
        
        const data = createResult.data;
        
        // Add back the imageSource for UI purposes
        const enhancedData = {
          ...makeSerializable(data),
          imageSource: originalImageSource || 'placeholder'
        };
        
        console.log('Enhanced data with imageSource for Redux:', enhancedData);
        return enhancedData;
      } catch (error) {
        // Give more detailed error information to help with debugging
        console.error('Error creating item:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        
        // Try to determine specific error type for better error messages
        let errorMessage = 'Failed to create item';
        if (error instanceof Error) {
          errorMessage = error.message;
          
          // Add more context if it's a validation error
          if (error.message.includes('validation')) {
            errorMessage = `Schema validation error: ${error.message}`;
          }
        }
        
        return rejectWithValue(errorMessage);
      }
    } catch (outerError) {
      console.error('Outer error in create process:', outerError);
      return rejectWithValue(outerError instanceof Error ? outerError.message : 'Failed to process item creation');
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

      // Store the original imageSource for adding to Redux state later
      const originalImageSource = itemData.imageSource;
      // Only remove 'valid' field; save all other fields as provided
      const { valid, ...directData } = itemData;
      console.log('Saving itemData directly to API (update):', directData);
      
      // Use a simpler approach that bypasses the problematic code
      console.log('Attempting simplified update for item:', itemData.id);
      
      try {
        if (!directData.id) {
          return rejectWithValue('Item ID is required for update');
        }
        
        console.log(`Updating item ID ${directData.id} with data:`, directData);
        
        // Use a straightforward update approach
        const updateResult = await client.models.Item.update(directData);
        
        console.log('Update result:', updateResult);
        
        if (!updateResult.data) {
          console.error('Failed to update item, no data returned');
          return rejectWithValue('Failed to update item');
        }
        
        const data = updateResult.data;
        
        // Add back the imageSource for UI purposes
        const enhancedData = {
          ...makeSerializable(data),
          imageSource: originalImageSource || 'placeholder'
        };
        
        console.log('Enhanced data with imageSource for Redux:', enhancedData);
        return enhancedData;
      } catch (error) {
        // Give more detailed error information to help with debugging
        console.error('Error updating item:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        
        // Try to determine specific error type for better error messages
        let errorMessage = 'Failed to update item';
        if (error instanceof Error) {
          errorMessage = error.message;
          
          // Add more context if it's a validation error
          if (error.message.includes('validation')) {
            errorMessage = `Schema validation error: ${error.message}`;
          }
        }
        
        return rejectWithValue(errorMessage);
      }
    } catch (outerError) {
      console.error('Outer error in update process:', outerError);
      return rejectWithValue(outerError instanceof Error ? outerError.message : 'Failed to process item update');
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