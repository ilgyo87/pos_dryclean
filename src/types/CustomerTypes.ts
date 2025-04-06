// Common type definitions for the application
// Customer type definition based on the Amplify schema
export type Customer = {
  id: string;
  businessID: string;
  firstName: string;
  lastName: string;
  phone: string; // Changed from 'phone'
  email?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  notes?: string | null;
  joinDate: string;
  lastActiveDate?: string | null;
  qrCode?: string | null;
  preferences?: string | null;
};