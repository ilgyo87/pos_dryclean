// src/utils/QRCodeGenerator.ts
// Utility for generating QR code data for various entity types

// Entity types for QR codes
export type EntityType = 'Business' | 'Employee' | 'Customer' | 'Order' | 'Product' | 'Garment' | 'Rack' | 'Unknown';

// Base entity data interface
export interface BaseEntityData {
    id: string;
    [key: string]: any;
}

/**
 * Generate standardized QR code data for different entity types
 * @param entityType Type of entity the QR code represents
 * @param data Entity data to encode
 * @returns JSON string with standardized QR code data
 */
export const generateQRCodeData = <T extends BaseEntityData>(
    entityType: EntityType,
    data: T
): string => {
    // Base data structure included in all QR codes
    const baseData = {
        type: entityType,
        id: data.id,
        timestamp: new Date().toISOString(),
    };

    // Add entity-specific data based on type
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
            // Generic format for other entity types
            return JSON.stringify({
                ...baseData,
                ...data,
            });
    }
};

/**
 * Parse QR code data back into structured format
 * @param qrValue String data from QR code
 * @returns Object with type and parsed data, or null if invalid
 */
export const parseQRCode = (qrValue: string): { type: EntityType; data: any } | null => {
    try {
        const parsedData = JSON.parse(qrValue);
        
        // Validate that the QR code contains a valid entity type
        if (parsedData && parsedData.type && 
            ['Business', 'Employee', 'Customer', 'Order', 'Product', 'Garment', 'Rack'].includes(parsedData.type)) {
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