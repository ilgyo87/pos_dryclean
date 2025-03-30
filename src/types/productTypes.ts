// Define interfaces for the application

// Route parameters interface
export interface RouteParams {
    businessId: string;
  }
  
  // Service interface
  export interface Service {
    id: string;
    name: string;
    description?: string;
    price: number;
    estimatedTime: number
    businessID: string;
    urlPicture?: string;
    createdAt?: string; 
  updatedAt?: string; 
  }
  
  // Product interface
  export interface Product {
    id: string;
    name: string;
    description?: string;
    price: number;
    businessID: string;
    serviceID: string;
    urlPicture?: string;
    createdAt?: string; 
    updatedAt?: string; 
  }
  
  // Service form data
  export interface ServiceFormData {
    name: string;
    description: string;
    price: string;
    estimatedTime: string;
    urlPicture: string;
  }
  
  // Product form data
  export interface ProductFormData {
    name: string;
    description: string;
    price: string;
    serviceID: string;
    urlPicture: string;
  }