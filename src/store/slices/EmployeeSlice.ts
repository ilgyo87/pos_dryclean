// src/store/slices/EmployeeSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { generateClient } from "aws-amplify/data";
import { Schema } from "../../../amplify/data/resource";
import type { RootState } from "../index";

const client = generateClient<Schema>();

// Define employee state interface
interface EmployeeState {
  employees: Schema["Employee"]["type"][];
  isLoading: boolean;
  error: string | null;
}

// Initial state
const initialState: EmployeeState = {
  employees: [],
  isLoading: false,
  error: null,
};

// Helper function to make employee objects serializable by removing functions
const makeSerializable = (employee: any) => {
  if (!employee) return employee;
  
  // Create a new object without the function properties
  const serializedEmployee = {...employee};
  
  // Remove the employeeShifts function if it exists
  if (typeof serializedEmployee.employeeShifts === "function") {
    delete serializedEmployee.employeeShifts;
  }
  
  return serializedEmployee;
};

// Async thunks
export const fetchEmployees = createAsyncThunk(
  "employee/fetchEmployees",
  async (userId: string, { rejectWithValue }) => {
    try {
      const { data, errors } = await client.models.Employee.list({
        filter: { userId: { eq: userId } }
      });

      if (errors) {
        return rejectWithValue(errors[0]?.message || "Failed to fetch employees");
      }
      
      // Make employees serializable before returning
      const serializedEmployees = data.map(makeSerializable);
      return serializedEmployees;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Failed to fetch employees");
    }
  }
);

export const createEmployee = createAsyncThunk(
  "employee/createEmployee",
  async ({ employeeData, userId }: { employeeData: any, userId: string }, { rejectWithValue }) => {
    try {
      // Validate required fields
      if (!employeeData.firstName || !employeeData.lastName || 
          !employeeData.phoneNumber || !employeeData.role || !employeeData.pinCode) {
        return rejectWithValue("Missing required employee data fields");
      }
      
      // Validate pinCode format (must be 4 digits)
      if (!employeeData.pinCode || !/^\d{4}$/.test(employeeData.pinCode)) {
        return rejectWithValue("PIN code must be exactly 4 digits");
      }
      
      // Remove the valid flag as it's not in the schema
      const { valid, ...cleanEmployeeData } = employeeData;
      
      const input = { 
        ...cleanEmployeeData, 
        userId,
        hireDate: new Date().toISOString() // Set the hire date automatically
      };
      
      console.log("Sending to API:", input);
      const { data, errors } = await client.models.Employee.create(input);

      if (errors) {
        return rejectWithValue(errors[0]?.message || "Failed to create employee");
      }
      
      // Make employee serializable before returning
      return makeSerializable(data);
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Failed to create employee");
    }
  }
);

export const updateEmployee = createAsyncThunk(
  "employee/updateEmployee",
  async ({ employeeData, userId }: { employeeData: any, userId: string }, { rejectWithValue }) => {
    try {
      // Validate required fields
      if (!employeeData.firstName || !employeeData.lastName || 
          !employeeData.phoneNumber || !employeeData.role || !employeeData.pinCode) {
        return rejectWithValue("Missing required employee data fields");
      }
      
      // Validate pinCode format (must be 4 digits)
      if (!employeeData.pinCode || !/^\d{4}$/.test(employeeData.pinCode)) {
        return rejectWithValue("PIN code must be exactly 4 digits");
      }
      
      // Remove the valid flag as it's not in the schema
      const { valid, ...cleanEmployeeData } = employeeData;
      const input = { ...cleanEmployeeData, userId };
      
      console.log("Sending to API for update:", input);
      const { data, errors } = await client.models.Employee.update(input);

      if (errors) {
        return rejectWithValue(errors[0]?.message || "Failed to update employee");
      }
      
      // Make employee serializable before returning
      return makeSerializable(data);
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Failed to update employee");
    }
  }
);

export const deleteEmployee = createAsyncThunk(
  "employee/deleteEmployee",
  async (employeeId: string, { rejectWithValue }) => {
    try {
      const { errors } = await client.models.Employee.delete({
        id: employeeId
      });

      if (errors) {
        return rejectWithValue(errors[0]?.message || "Failed to delete employee");
      }

      return employeeId;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Failed to delete employee");
    }
  }
);

// Employee slice
const EmployeeSlice = createSlice({
  name: "employee",
  initialState,
  reducers: {
    clearErrors: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch employees
      .addCase(fetchEmployees.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchEmployees.fulfilled, (state, action) => {
        state.employees = action.payload;
        state.isLoading = false;
      })
      .addCase(fetchEmployees.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Create employee
      .addCase(createEmployee.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createEmployee.fulfilled, (state, action) => {
        state.employees.push(action.payload);
        state.isLoading = false;
      })
      .addCase(createEmployee.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Update employee
      .addCase(updateEmployee.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateEmployee.fulfilled, (state, action) => {
        const index = state.employees.findIndex(e => e.id === action.payload.id);
        if (index !== -1) {
          state.employees[index] = action.payload;
        }
        state.isLoading = false;
      })
      .addCase(updateEmployee.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Delete employee
      .addCase(deleteEmployee.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteEmployee.fulfilled, (state, action) => {
        state.employees = state.employees.filter(e => e.id !== action.payload);
        state.isLoading = false;
      })
      .addCase(deleteEmployee.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  }
});

export const { clearErrors } = EmployeeSlice.actions;
export default EmployeeSlice.reducer;