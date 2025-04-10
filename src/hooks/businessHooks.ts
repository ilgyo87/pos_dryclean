import { generateClient } from "aws-amplify/api";
import type { Schema } from "../../amplify/data/resource";

const client = generateClient<Schema>();

export default async function createBusiness(userId: string, businessName: string, firstName: string, lastName: string, phoneNumber: string, qrCode: string) {
    const {data: business, errors} = await client.models.Business.create({
        name: businessName,
        firstName: firstName,
        lastName: lastName,
        phoneNumber: phoneNumber,
        userId: userId,
        qrCode: qrCode
    })

    if (errors) {
        console.error("Error creating business:", errors);
        return null;
    }

    return business;
}
