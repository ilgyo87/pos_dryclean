// src/store/index.ts
import { configureStore } from '@reduxjs/toolkit';
import customerReducer from './slices/CustomerSlice';
import employeeReducer from './slices/EmployeeSlice';
import categoryReducer from './slices/CategorySlice';
import itemReducer from './slices/ItemSlice';

export const store = configureStore({
  reducer: {
    customer: customerReducer,
    employee: employeeReducer,
    category: categoryReducer,
    item: itemReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types to avoid false positives
        ignoredActions: [
          'customer/fetchCustomers/fulfilled', 
          'customer/updateCustomer/fulfilled', 
          'customer/createCustomer/fulfilled',
          'employee/fetchEmployees/fulfilled',
          'employee/updateEmployee/fulfilled',
          'employee/createEmployee/fulfilled',
          'category/fetchCategories/fulfilled',
          'category/updateCategory/fulfilled',
          'category/createCategory/fulfilled',
          'item/fetchItems/fulfilled',
          'item/updateItem/fulfilled',
          'item/createItem/fulfilled'
        ],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;