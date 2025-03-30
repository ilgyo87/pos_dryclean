import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { Service, Product } from '../types/productTypes';

// Initialize Amplify client
const client = generateClient<Schema>();

export const AmplifyService = {
  // Service operations
  fetchServices: async (businessId: string) => {
    try {
      const result = await client.models.Service.list({
        filter: { businessID: { eq: businessId } }
      });
      return result.data as unknown as Service[];
    } catch (error) {
      console.error('Error fetching services:', error);
      throw error;
    }
  },

  createService: async (serviceData: {
    name: string;
    description?: string;
    price: number;
    businessID: string;
    urlPicture?: string;
  }) => {
    try {
      const result = await client.models.Service.create(serviceData);
      return result.data as unknown as Service;
    } catch (error) {
      console.error('Error creating service:', error);
      throw error;
    }
  },

  updateService: async (serviceData: {
    id: string;
    name?: string;
    description?: string;
    price?: number;
    urlPicture?: string;
  }) => {
    try {
      const result = await client.models.Service.update(serviceData);
      return result.data as unknown as Service;
    } catch (error) {
      console.error('Error updating service:', error);
      throw error;
    }
  },

  deleteService: async (serviceId: string) => {
    try {
      await client.models.Service.delete({ id: serviceId });
      return true;
    } catch (error) {
      console.error('Error deleting service:', error);
      throw error;
    }
  },

  // Product operations
  fetchProducts: async (businessId: string) => {
    try {
      const result = await client.models.Product.list({
        filter: { businessID: { eq: businessId } }
      });
      return result.data as unknown as Product[];
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  },

  createProduct: async (productData: {
    name: string;
    description?: string;
    price: number;
    businessID: string;
    serviceID: string;
    urlPicture?: string;
  }) => {
    try {
      const result = await client.models.Product.create(productData);
      return result.data as unknown as Product;
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  },

  updateProduct: async (productData: {
    id: string;
    name?: string;
    description?: string;
    price?: number;
    serviceID?: string;
    urlPicture?: string;
  }) => {
    try {
      const result = await client.models.Product.update(productData);
      return result.data as unknown as Product;
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  },

  deleteProduct: async (productId: string) => {
    try {
      await client.models.Product.delete({ id: productId });
      return true;
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  }
};

export default AmplifyService;