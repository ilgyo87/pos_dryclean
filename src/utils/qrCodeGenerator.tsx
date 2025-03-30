// src/utils/qrCodeGenerator.tsx
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import React from 'react';
import QRCode from 'react-native-qrcode-svg';
import { View } from 'react-native';
import { uploadData } from 'aws-amplify/storage';
import { toDataURL } from 'qrcode';

// Initialize Amplify client
const client = generateClient<Schema>();

// Define the entity types matching your schema
export type EntityType = 'Business' | 'Employee' | 'Customer' | 'Garment';

// Define a common interface for entity data
interface BaseEntityData {
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
 * QR Code component that renders an SVG QR code for an entity
 */
export const EntityQRCode = <T extends BaseEntityData>({ 
  entityType, 
  data, 
  size = 200
}: { 
  entityType: EntityType;
  data: T;
  size?: number;
}) => {
  // Generate QR code data
  const qrCodeData = generateQRCodeData(entityType, data);
  
  return (
    <View style={{ backgroundColor: 'white', padding: 10 }}>
      <QRCode
        value={qrCodeData}
        size={size}
        backgroundColor="white"
        color="black"
      />
    </View>
  );
};

/**
 * Gets entity data by ID and type
 */
export const getEntityData = async <T extends BaseEntityData>(
  entityType: EntityType, 
  entityId: string
): Promise<T | null> => {
  try {
    let result;
    
    // Use type-specific get calls
    switch (entityType) {
      case 'Business':
        result = await client.models.Business.get({ id: entityId });
        break;
      
      case 'Employee':
        result = await client.models.Employee.get({ id: entityId });
        break;
      
      case 'Customer':
        result = await client.models.Customer.get({ id: entityId });
        break;
      
      case 'Garment':
        result = await client.models.Garment.get({ id: entityId });
        break;
      
      default:
        throw new Error(`Invalid entity type: ${entityType}`);
    }
    
    // Safely convert the complex object to our expected type
    if (result && result.data) {
      // First convert to unknown, then to our target type
      return result.data as unknown as T;
    }
    
    return null;
  } catch (error) {
    console.error(`Error getting ${entityType}:`, error);
    return null;
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
/**
 * Generates a QR code image and uploads it to S3
 */
export const generateAndUploadQRCode = async <T extends BaseEntityData>(
  entityType: EntityType,
  data: T
): Promise<string | null> => {
  try {
    // Generate QR code data
    const qrCodeData = generateQRCodeData(entityType, data);
    
    // Convert QR code to a data URL (PNG image)
    const qrImageDataURL = await new Promise<string>((resolve, reject) => {
      toDataURL(qrCodeData, { 
        errorCorrectionLevel: 'H',
        width: 400,
        margin: 1
      }, (err, url) => {
        if (err) reject(err);
        else resolve(url);
      });
    });
    
    // Convert data URL to blob
    const base64Data = qrImageDataURL.split(',')[1];
    const blob = Buffer.from(base64Data, 'base64');
    
    // Create a unique filename
    const filename = `qrcodes/${entityType}/${data.id}_${Date.now()}.png`;
    
    // Upload to S3
    const result = await uploadData({
      key: filename,
      data: blob,
      options: {
        contentType: 'image/png'
      }
    });
    
    return filename; 
  } catch (error) {
    console.error('Error generating and uploading QR code:', error);
    return null;
  }
};

/**
 * Updates an entity with its QR code URL
 */
export const attachQRCodeToEntity = async <T extends BaseEntityData>(
  entityType: EntityType,
  entityId: string,
  qrCodeUrl: string
): Promise<boolean> => {
  try {
    let result;
    
    // Update entity with QR code URL
    switch (entityType) {
      case 'Customer':
        result = await client.models.Customer.update({
          id: entityId,
          qrCode: qrCodeUrl
        });
        break;
      
      case 'Garment':
        result = await client.models.Garment.update({
          id: entityId,
          qrCode: qrCodeUrl
        });
        break;
      
      // Add other entity types as needed
      
      default:
        throw new Error(`QR code attachment not supported for type: ${entityType}`);
    }
    
    return !!result.data;
  } catch (error) {
    console.error(`Error attaching QR code to ${entityType}:`, error);
    return false;
  }
};