import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';

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