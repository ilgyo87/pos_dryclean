import { generateClient } from 'aws-amplify/data';
import { seedData } from './seedData';
import { v4 as uuidv4 } from 'uuid';
import { type Schema } from '../../amplify/data/resource';

// Create a GraphQL client using the Amplify Gen 2 approach
const client = generateClient<Schema>();

export const seedBusinessData = async (businessId: string): Promise<void> => {
  try {
    // Check if this business already has services to avoid duplicate seeding
    const existingServicesResponse = await client.models.Service.list({
      filter: { businessID: { eq: businessId } }
    });
    
    if (existingServicesResponse.data.length > 0) {
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
      
      const serviceResponse = await client.models.Service.create(serviceInput);
      const service = serviceResponse.data;
      
      if (!service) {
        console.error('Failed to create service:', serviceData.name);
        continue;
      }
      
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
        
        await client.models.Product.create(productInput);
      }
    }
    
    console.log('Completed seeding data for business', businessId);
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
};