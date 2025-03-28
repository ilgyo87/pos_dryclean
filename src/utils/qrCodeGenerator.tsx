// src/utils/qrCodeGenerator.tsx
import { uploadData, getUrl, remove } from 'aws-amplify/storage';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import React from 'react';
import QRCode from 'react-native-qrcode-svg';
import { captureRef } from 'react-native-view-shot';
import { View } from 'react-native';

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
 * QR Code component that renders an SVG QR code
 */
export const QRCodeComponent = React.forwardRef<View, { value: string; size?: number; }>((props, ref) => {
  return (
    <View ref={ref} style={{ backgroundColor: 'white', padding: 10 }}>
      <QRCode
        value={props.value}
        size={props.size || 200}
        backgroundColor="white"
        color="black"
      />
    </View>
  );
});

/**
 * Generates a QR code as a blob from QR data
 */
export const generateQRCodeBlob = async (qrCodeData: string, size: number = 200): Promise<Blob> => {
  // Create a ref to capture
  const qrCodeRef = React.createRef<View>();
  
  // Create a temporary component with the QR code
  const TempQRComponent = () => (
    <QRCodeComponent ref={qrCodeRef} value={qrCodeData} size={size} />
  );
  
  // Render the component
  const component = <TempQRComponent />;
  
  try {
    // Capture the QR code as a URI
    const uri = await captureRef(qrCodeRef, {
      format: 'png',
      quality: 1
    });
    
    // Fetch the image as a blob
    const response = await fetch(uri);
    const blob = await response.blob();
    
    return blob;
  } catch (error) {
    console.error('Error generating QR code blob:', error);
    throw error;
  }
};

/**
 * Saves QR code data to S3 and returns the URL
 */
export const saveQRCodeToS3 = async (
  entityType: EntityType,
  entityId: string, 
  businessId: string,
  qrCodeBlob: Blob
): Promise<string> => {
  try {
    // Create the path for storing the QR code based on storage resource configuration
    // Using entity_id path structure as defined in storage resource
    const s3Key = `qrcodes/${businessId}/${entityType.toLowerCase()}_${entityId}.png`;
    
    // Upload the QR code image (Blob) to S3
    await uploadData({
      path: s3Key,
      data: qrCodeBlob,
      options: {
        contentType: 'image/png'
      }
    }).result;
    
    // Get the URL of the uploaded QR code
    const urlResult = await getUrl({
      path: s3Key
    });
    
    const url = urlResult.url.toString();
    
    // Update the entity with the QR code URL
    await updateEntityWithQRCode(entityType, entityId, url);
    
    return url;
  } catch (error) {
    console.error('Error saving QR code:', error);
    throw error;
  }
};

/**
 * Updates an entity with its QR code URL
 */
const updateEntityWithQRCode = async (
  entityType: EntityType,
  entityId: string,
  qrCodeUrl: string
): Promise<void> => {
  try {
    // Use type-specific update calls instead of dynamic access
    switch (entityType) {
      case 'Business':
        await client.models.Business.update({
          id: entityId,
          qrCodeImageUrl: qrCodeUrl
        });
        break;
      
      case 'Employee':
        await client.models.Employee.update({
          id: entityId,
          qrCodeImageUrl: qrCodeUrl
        });
        break;
      
      case 'Customer':
        await client.models.Customer.update({
          id: entityId,
          qrCodeImageUrl: qrCodeUrl
        });
        break;
      
      case 'Garment':
        await client.models.Garment.update({
          id: entityId,
          qrCodeImageUrl: qrCodeUrl
        });
        break;
      
      default:
        throw new Error(`Invalid entity type: ${entityType}`);
    }
  } catch (error) {
    console.error(`Error updating ${entityType} with QR code URL:`, error);
    throw error;
  }
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
 * Creates a QR code for an entity if needed
 */
export const createQRCodeIfNeeded = async (
  entityType: EntityType,
  entityId: string,
  businessId: string
): Promise<string | null> => {
  try {
    // Get entity data
    const entity = await getEntityData<BaseEntityData>(entityType, entityId);
    
    // If entity has a QR code already, return the URL
    if (entity && entity.qrCodeImageUrl) {
      return entity.qrCodeImageUrl;
    }
    
    // Entity exists but has no QR code
    if (entity) {
      // Generate QR code data
      const qrCodeData = generateQRCodeData(entityType, entity);
      
      // Save QR code to S3
      return await saveQRCodeToS3(entityType, entityId, businessId, await generateQRCodeBlob(qrCodeData));
    }
    
    // Return null if entity doesn't exist
    return null;
  } catch (error) {
    console.error(`Error checking QR code for ${entityType}:`, error);
    throw error;
  }
};

/**
 * Deletes a QR code from S3
 */
export const deleteQRCodeFromS3 = async (
  entityType: EntityType,
  entityId: string,
  businessId: string
): Promise<void> => {
  try {
    // Get the entity to find the QR code URL
    const entity = await getEntityData<BaseEntityData>(entityType, entityId);
    
    if (entity && entity.qrCodeImageUrl) {
      // Use the same key structure as in saveQRCodeToS3
      const s3Key = `qrcodes/${businessId}/${entityType.toLowerCase()}_${entityId}.png`;
      
      // Delete the QR code from S3
      await remove({
        path: s3Key
      });
      
      // Update the entity to remove the QR code URL
      await updateEntityWithQRCode(entityType, entityId, '');
    }
  } catch (error) {
    console.error(`Error deleting QR code for ${entityType}:`, error);
    throw error;
  }
};