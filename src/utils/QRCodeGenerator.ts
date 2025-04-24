import { uploadData } from 'aws-amplify/storage';
import { Alert } from 'react-native';

// src/utils/QRCodeGenerator.ts
export type EntityType = 'Business' | 'Employee' | 'Customer' | 'Order' | 'Product' | 'Garment' | 'Rack' | 'Unknown';

export interface BaseEntityData {
    id: string;
    [key: string]: any;
}

export const generateQRCodeData = <T extends BaseEntityData>(
    entityType: EntityType,
    data: T
): string => {
    const baseData = {
        type: entityType,
        id: data.id,
        timestamp: new Date().toISOString(),
    };

    switch (entityType) {
        case 'Business':
            return JSON.stringify({
                ...baseData,
                name: data.name,
                phoneNumber: data.phoneNumber,
            });

        case 'Employee':
            return JSON.stringify({
                ...baseData,
                employeeId: data.id,
                phone: data.phone,
                pin: data.pin,
                businessId: data.businessId,
            });

        case 'Customer':
            return JSON.stringify({
                ...baseData,
                customerId: data.id,
                phone: data.phone,
                businessId: data.businessId,
            });

        case 'Order':
            return JSON.stringify({
                ...baseData,
                orderId: data.id,
                customerId: data.customerId,
                employeeId: data.employeeId,
                businessId: data.businessId,
            });

        case 'Product':
            return JSON.stringify({
                ...baseData,
                productId: data.id,
                orderItemId: data.orderItemId,
                orderId: data.orderId,
                customerId: data.customerId,
                businessId: data.businessId,
            });

        case 'Garment':
            return JSON.stringify({
                ...baseData,
                businessId: data.businessID,
                customerId: data.customerID,
            });

        case 'Rack':
            return JSON.stringify({
                ...baseData,
                businessId: data.businessID,
            });

        default:
            return JSON.stringify({
                ...baseData,
                ...data,
            });
    }
};

// Used when scanning QR Codes
export const parseQRCode = (qrValue: string): { type: EntityType, data: any } | null => {
    try {
        const parsedData = JSON.parse(qrValue);
        if (parsedData && parsedData.type && ['Business', 'Employee', 'Customer', 'Order', 'Product', 'Garment'].includes(parsedData.type)) {
            return {
                type: parsedData.type as EntityType,
                data: parsedData
            };
        }
        return null;
    } catch (error) {
        console.error('Error parsing QR code data:', error);
        return null;
    }
};

// Handle QR code capture
export const uploadQRCapture = async (uri: string, type: EntityType, title: string) => {
    // Convert data URI to blob
    const response = await fetch(uri);
    const blob = await response.blob();

    // Create unique filename with datetime for S3
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-');
    const filename = `qrcodes/${type}/${title}_${timestamp}.png`;

    // Upload to S3
    try {
        const result = await uploadData({
            path: filename,
            data: blob,
            options: {
                contentType: 'image/png'
            }
        }).result;
        console.log('Successfully uploaded QR code:', result);
        return result;
    } catch (error) {
        console.error('Upload error:', error);
        Alert.alert('Error', `Failed to save QR code: ${error}`);
        return null;
    }
};