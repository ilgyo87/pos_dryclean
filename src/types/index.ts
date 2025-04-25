// src/types/index.ts - Updated with minimal changes to fix type errors

export interface Location {
  lat: number;
  long: number;
}

export interface BusinessFormProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export interface BusinessFormState {
  businessName: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
}

export interface Category {
  _id: string;
  name: string;
  color?: string;
  businessId?: string;
}

// Updated Product interface with type and serviceId properties
export interface Product {
  _id: string;
  name: string;
  price: number;
  discount?: number;
  additionalPrice?: number;
  description?: string;
  categoryId?: string;
  businessId?: string;
  customerId?: string;
  customer?: Customer;
  employeeId?: string;
  orderId?: string;
  orderItemId?: string;
  starch?: string;
  pressOnly?: boolean;
  imageName?: string;
  imageUrl?: string;
  notes: string[];
  status: string;
  createdAt?: Date;
  updatedAt?: Date;
  // Add missing properties
  type?: 'service' | 'product';
  serviceId?: string;
}

export interface Customer {
  _id: string;
  firstName: string;
  lastName: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phone: string;
  location?: Location;
  email?: string;
  businessId?: string;
  cognitoId?: string;
  imageName?: string;
  notes: string[];
  createdAt: Date;
  updatedAt?: Date;
  dob?: Date; // Date of birth
}

// Garment removed per backend
export interface Business {
  _id: string;
  businessName: string;
  firstName?: string;
  lastName?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phone: string;
  location?: Location;
  email: string;
  website?: string;
  hours?: string[];
  logoUrl?: string;
  logoSource?: string;
  userId?: string;
  // orders removed
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Order {
  _id: string;
  businessId: string;
  customerId: string;
  employeeId: string;
  items: Product[];
  paymentMethod: string;
  additionalPrice?: number;
  discount?: number;
  total: number;
  notes: string[];
  pickupDate?: Date;
  status: string;
  createdAt: Date;
  updatedAt?: Date;
  customerName?: string; // Added for order display
  employeeName?: string; // Added for order display
}

export interface OrderItem {
  _id: string;
  name: string;
  description?: string;
  price?: number;
  discount?: number;
  category?: string;
  businessId?: string;
  customerId?: string;
  employeeId?: string;
  orderId?: string;
  orderIdHistory?: string[];
  starch?: 'none' | 'light' | 'medium' | 'heavy';
  pressOnly?: boolean;
  order?: Order;
  // Add missing properties for compatibility with CheckoutItem
  quantity?: number;
  type?: 'service' | 'product';
  serviceId?: string;
  options?: {
    starch?: 'none' | 'light' | 'medium' | 'heavy';
    pressOnly?: boolean;
    notes?: string;
  };
}

export interface Employee {
  _id: string;
  firstName: string;
  lastName: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phone: string;
  location?: Location;
  email?: string;
  businessId?: string;
  cognitoId?: string;
  pin?: string;
  role: string;
  createdAt: Date;
  updatedAt?: Date;
}

// Add OrderStatus enum for use in CheckoutScreen
export enum OrderStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  READY = 'ready',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

// Add CheckoutItem type for compatibility
export type CheckoutItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  type: 'service' | 'product';
  serviceId?: string;
  options?: {
    starch?: 'none' | 'light' | 'medium' | 'heavy';
    pressOnly?: boolean;
    notes?: string;
  };
};
