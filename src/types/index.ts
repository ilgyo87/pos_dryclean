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

export interface Product {
  imageName?: string;
  _id: string;
  name: string;
  description?: string;
  price?: number;
  categoryId: string;
  businessId?: string;
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
} // Garment removed per backend
  
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
} // orders removed, logoSource added

  export interface Order {
  _id: string;
  businessId: string;
  business?: Business;
  customerId: string;
  employeeId: string;
  items: OrderItem[];
  paymentMethod: string;
  total: number;
  status: string;
  createdAt?: Date;
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
}