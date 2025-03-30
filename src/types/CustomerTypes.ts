// Common type definitions for the application

// Customer type definition based on the Amplify schema
export type Customer = {
  id: string;
  businessID: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email?: string | null;
  address?: string | null;
  qrCode?: string | null;
  globalId?: string | null;
  preferredContactMethod?: string | null;
  notificationPreferences?: string | null;
  [key: string]: any; // For other flexible properties
};
