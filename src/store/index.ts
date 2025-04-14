// src/store/index.ts
import { configureStore } from '@reduxjs/toolkit';
import customerReducer from './slices/CustomerSlice';

export const store = configureStore({
  reducer: {
    customer: customerReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types to avoid false positives
        ignoredActions: ['customer/fetchCustomers/fulfilled', 'customer/updateCustomer/fulfilled', 'customer/createCustomer/fulfilled'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;