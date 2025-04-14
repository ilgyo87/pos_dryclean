// src/store/slices/CategorySlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { generateClient } from 'aws-amplify/data';
import { Schema } from '../../../amplify/data/resource';
import type { RootState } from '../index';

const client = generateClient<Schema>();

// Define category state interface
interface CategoryState {
  categories: Schema['Category']['type'][];
  isLoading: boolean;
  error: string | null;
}

// Initial state
const initialState: CategoryState = {
  categories: [],
  isLoading: false,
  error: null,
};

// Helper function to make category objects serializable
const makeSerializable = (category: any) => {
  if (!category) return category;
  
  // Create a new object without the function properties
  const serializedCategory = {...category};
  
  // Remove the items function if it exists
  if (typeof serializedCategory.items === 'function') {
    delete serializedCategory.items;
  }
  
  return serializedCategory;
};

// Async thunks
export const fetchCategories = createAsyncThunk(
  'category/fetchCategories',
  async (userId: string, { rejectWithValue }) => {
    try {
      const { data, errors } = await client.models.Category.list({
        filter: { userId: { eq: userId } }
      });

      if (errors) {
        return rejectWithValue(errors[0]?.message || 'Failed to fetch categories');
      }
      
      // Make categories serializable before returning
      const serializedCategories = data.map(makeSerializable);
      return serializedCategories;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch categories');
    }
  }
);

export const createCategory = createAsyncThunk(
  'category/createCategory',
  async ({ categoryData, userId }: { categoryData: any, userId: string }, { rejectWithValue }) => {
    try {
      // Validate required fields
      if (!categoryData.name) {
        return rejectWithValue('Category name is required');
      }
      
      const input = { ...categoryData, userId };
      const { data, errors } = await client.models.Category.create(input);

      if (errors) {
        return rejectWithValue(errors[0]?.message || 'Failed to create category');
      }
      
      // Make category serializable before returning
      return makeSerializable(data);
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to create category');
    }
  }
);

export const updateCategory = createAsyncThunk(
  'category/updateCategory',
  async ({ categoryData, userId }: { categoryData: any, userId: string }, { rejectWithValue }) => {
    try {
      // Validate ID and required fields
      if (!categoryData.id) {
        return rejectWithValue('Category ID is required for update');
      }
      
      if (!categoryData.name) {
        return rejectWithValue('Category name is required');
      }
      
      const input = { ...categoryData, userId };
      const { data, errors } = await client.models.Category.update(input);

      if (errors) {
        return rejectWithValue(errors[0]?.message || 'Failed to update category');
      }
      
      // Make category serializable before returning
      return makeSerializable(data);
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to update category');
    }
  }
);

export const deleteCategory = createAsyncThunk(
  'category/deleteCategory',
  async (categoryId: string, { rejectWithValue }) => {
    try {
      const { errors } = await client.models.Category.delete({
        id: categoryId
      });

      if (errors) {
        return rejectWithValue(errors[0]?.message || 'Failed to delete category');
      }

      return categoryId;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to delete category');
    }
  }
);

// Category slice
const CategorySlice = createSlice({
  name: 'category',
  initialState,
  reducers: {
    clearErrors: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch categories
      .addCase(fetchCategories.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.categories = action.payload;
        state.isLoading = false;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Create category
      .addCase(createCategory.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createCategory.fulfilled, (state, action) => {
        state.categories.push(action.payload);
        state.isLoading = false;
      })
      .addCase(createCategory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Update category
      .addCase(updateCategory.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateCategory.fulfilled, (state, action) => {
        const index = state.categories.findIndex(c => c.id === action.payload.id);
        if (index !== -1) {
          state.categories[index] = action.payload;
        }
        state.isLoading = false;
      })
      .addCase(updateCategory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Delete category
      .addCase(deleteCategory.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteCategory.fulfilled, (state, action) => {
        state.categories = state.categories.filter(c => c.id !== action.payload);
        state.isLoading = false;
      })
      .addCase(deleteCategory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  }
});

export const { clearErrors } = CategorySlice.actions;
export default CategorySlice.reducer;