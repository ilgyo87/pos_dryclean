import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';
import { Amplify } from 'aws-amplify';

// This is critical - configure Amplify before using the client
Amplify.configure({
    API: {
      GraphQL: {
        endpoint: process.env.API_ENDPOINT || '',
        region: process.env.REGION,
        defaultAuthMode: 'apiKey',
        apiKey: process.env.API_KEY
      }
    }
  });

const client = generateClient<Schema>();

export const handler: Schema['fetchBusiness']['functionHandler'] = async (event) => {
    const userId = event.arguments.userId;  
    const { data: business, errors } = await client.models.Business.list(
        {
            filter: {
                userId: { eq: userId }
            }
        }
    );

    if (errors) {
        console.error("Error fetching business or no business found:", errors);
        return null;
    }

  return business[0];
};