import { generateClient } from 'aws-amplify/api';
import { seedData } from './seedData';
import { v4 as uuidv4 } from 'uuid';

// Create a GraphQL client using the Amplify Gen 2 approach
const client = generateClient();

// Define GraphQL operations directly
const listServicesQuery = `
  query ListServices($filter: ModelServiceFilterInput) {
    listServices(filter: $filter) {
      items {
        id
      }
    }
  }
`;

const createServiceMutation = `
  mutation CreateService($input: CreateServiceInput!) {
    createService(input: $input) {
      id
      name
      businessID
    }
  }
`;

const createProductMutation = `
  mutation CreateProduct($input: CreateProductInput!) {
    createProduct(input: $input) {
      id
      name
      businessID
      serviceID
    }
  }
`;

export const seedBusinessData = async (businessId: string): Promise<void> => {
  try {
    // Check if this business already has services to avoid duplicate seeding
    const existingServicesResponse = await client.graphql({
      query: listServicesQuery,
      variables: {
        filter: { businessID: { eq: businessId } }
      }
    }) as { data: { listServices: { items: { id: string }[] } } };
    
    if (existingServicesResponse.data.listServices.items.length > 0) {
      console.log('Business already has services, skipping seed');
      return;
    }
    
    console.log('Starting to seed data for business', businessId);
    
    // Process each service directly (no more nested categories)
    for (const serviceData of seedData) {
      // Create the service
      const serviceInput = {
        id: uuidv4(),
        businessID: businessId,
        name: serviceData.name,
        description: serviceData.description,
        price: serviceData.price,
        estimatedTime: serviceData.estimatedTime,
        urlPicture: serviceData.urlPicture
      };
      
      const serviceResponse = await client.graphql({
        query: createServiceMutation,
        variables: { input: serviceInput }
      }) as { data: { createService: { id: string } } };
      
      const service = serviceResponse.data.createService as { id: string, name: string };
      console.log(`Created service: ${service.name}`);
      
      // Create associated products
      for (const productData of serviceData.products) {
        const productInput = {
          id: uuidv4(),
          businessID: businessId,
          serviceID: service.id,
          name: productData.name,
          description: productData.description,
          price: productData.price,
          urlPicture: productData.urlPicture
        };
        
        await client.graphql({
          query: createProductMutation,
          variables: { input: productInput }
        });
      }
    }
    
    console.log('Completed seeding data for business', businessId);
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
};