import type { Schema } from '../../../amplify/data/resource';
import { generateClient } from 'aws-amplify/data';

const client = generateClient<Schema>();

export const handler: Schema['fetchAllBusinesses']['functionHandler'] = async () => {
    const { data: businesses, errors } = await client.models.Business.list();

    if (errors) {
        console.error("Error fetching business or no business found:", errors);
        return [];
    }

    const phoneNumbers = businesses.map(business => business.phoneNumber);

  return phoneNumbers;
};