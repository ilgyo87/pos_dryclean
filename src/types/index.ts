export interface Location {
    lat: number;
    long: number;
}

export interface Customer {
    _id: string;
    firstName: string;
    lastName: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    phone?: string;
    email?: string;
    coordinates?: Location;
    businessId?: string;
    cognitoId?: string;
    orders?: Order[];
    garments?: Garment[];
  }
  
  export interface Business {
    _id: string;
    businessName: string;
    firstName: string;
    lastName: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    phone: string;
    coordinates?: Location;
    email?: string;
    website?: string;
    hours?: string[];
    logoUrl?: string;
    userId: string;
    orders?: Order[];
  }

  export interface Order {
    _id: string;
    customerId: string;
    items: Product[];
    total: number;
    paymentMethod: string;
    status: string;
    createdAt: Date;
  }

  export interface Category {
    _id: string;
    name: string;
    description?: string;
    products?: Product[];
  }

  export interface Product {
    _id: string;
    name: string;
    price: number;
    alteredPrice?: number;
    dueDate?: Date;
    imageUrl?: string;
    imageSource?: string;
    orderId?: string;
    starch?: string;
    pressOnly?: boolean;
    description?: string;
    notes?: string[];
    categoryId: string;
  }

  export interface Garment {
    _id: string;
    name: string;
    description: string;
    customerId: string;
  }