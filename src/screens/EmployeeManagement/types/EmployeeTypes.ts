// src/types/EmployeeTypes.ts
import { Schema } from '../../../../amplify/data/resource';

// Export the Employee type from the Schema
export type Employee = Schema['Employee']['type'];

// Export the EmployeeShift type from the Schema
export type EmployeeShift = Schema['EmployeeShift']['type'];

// Define the role options for employees
export enum EmployeeRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  STAFF = 'STAFF'
}

// Define the status options for employees
export enum EmployeeStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED'
}

// Define the status options for shifts
export enum ShiftStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED'
}

// Define a type for employee permissions
export interface EmployeePermissions {
  manageEmployees: boolean;
  manageCustomers: boolean;
  manageProducts: boolean;
  manageOrders: boolean;
  viewReports: boolean;
  processTransactions: boolean;
  manageSettings: boolean;
}

// Define a type for employee performance metrics
export interface EmployeePerformance {
  transactionsProcessed: number;
  salesAmount: number;
  ordersProcessed: number;
  customerRating: number;
  shiftsCompleted: number;
  hoursWorked: number;
}

// Define a type for creating a new employee
export interface CreateEmployeeInput {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  role: EmployeeRole;
  hourlyRate?: number;
  hireDate: Date;
  status: EmployeeStatus;
  permissions: string; // JSON string of permissions
  businessID: string;
  qrCode?: string;
}

// Define a type for updating an existing employee
export interface UpdateEmployeeInput {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  role?: EmployeeRole;
  hourlyRate?: number;
  status?: EmployeeStatus;
  permissions?: string; // JSON string of permissions
  qrCode?: string;
}

// Define a type for creating a new employee shift
export interface CreateEmployeeShiftInput {
  employeeID: string;
  businessID: string;
  clockIn: Date;
  clockOut?: Date;
  duration?: number;
  status: ShiftStatus;
  notes?: string;
}

// Define a type for updating an existing employee shift
export interface UpdateEmployeeShiftInput {
  id: string;
  clockOut?: Date;
  duration?: number;
  status?: ShiftStatus;
  notes?: string;
}

// Define a type for employee list filtering
export interface EmployeeFilterOptions {
  role?: EmployeeRole;
  status?: EmployeeStatus;
  searchQuery?: string;
}

// Define a type for employee shift list filtering
export interface ShiftFilterOptions {
  employeeID?: string;
  status?: ShiftStatus;
  startDate?: Date;
  endDate?: Date;
}
