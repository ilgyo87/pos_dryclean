// src/utils/qrCodeGenerator.ts

// Define the entity types matching your schema
export type EntityType = 'Business' | 'Employee' | 'Customer' | 'Garment';

// Define a common interface for entity data
export interface BaseEntityData {
  id: string;
  [key: string]: any; // Allow other properties
}

/**
 * Generates QR code data based on entity type and data
 */
export const generateQRCodeData = <T extends BaseEntityData>(
  entityType: EntityType, 
  data: T
): string => {
  // Common fields for all entity types
  const baseData = {
    type: entityType,
    id: data.id,
    timestamp: new Date().toISOString(),
  };
  
  // Create entity-specific QR data
  switch (entityType) {
    case 'Business':
      return JSON.stringify({
        ...baseData,
        name: data.name,
        phoneNumber: data.phoneNumber,
        // Additional business-specific fields can be included here
      });
    
    case 'Employee':
      return JSON.stringify({
        ...baseData,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        businessId: data.businessID,
      });
    
    case 'Customer':
      return JSON.stringify({
        ...baseData,
        firstName: data.firstName,
        lastName: data.lastName,
        phoneNumber: data.phoneNumber,
        email: data.email,
        businessId: data.businessID,
      });
    
    case 'Garment':
      return JSON.stringify({
        ...baseData,
        description: data.description,
        type: data.type,
        color: data.color,
        customerId: data.customerID,
        businessId: data.businessID,
      });
    
    default:
      // Fallback for any other entity types
      return JSON.stringify({
        ...baseData,
        ...data,
      });
  }
};

/**
 * Parses a QR code value back to an entity object
 */
export const parseQRCode = (qrValue: string): { type: EntityType, data: any } | null => {
  try {
    const parsedData = JSON.parse(qrValue);
    if (parsedData && parsedData.type && ['Business', 'Employee', 'Customer', 'Garment'].includes(parsedData.type)) {
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