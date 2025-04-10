import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';

const client = generateClient<Schema>();

export const handler: Schema['fetchCustomers']['functionHandler'] = async (event) => {
    const userId = event.arguments.userId;
    const { data: customers, errors } = await client.models.Customer.list(
        {
            filter: {
                userId: { eq: userId }
            }
        }
    );

    if (errors) {
        console.error("Error fetching customers:", errors);
        return [];
    }

    return customers;
};