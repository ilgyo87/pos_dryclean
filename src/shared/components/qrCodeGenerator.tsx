// src/utils/qrCodeGenerator.tsx
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource'; // Ensure this import is correct and the file is up-to-date
import QRCode from 'react-native-qrcode-svg';
import { View } from 'react-native';
import { getUrl } from 'aws-amplify/storage';


// Initialize the Amplify client with your schema
const client = generateClient<Schema>();

// Define the entity types matching your schema
// Make sure all these types ('Business', 'Employee', 'Customer', 'Garment')
// are actually defined in your amplify/data/resource.ts schema.
export type EntityType = 'Business' | 'Employee' | 'Customer' | 'Garment';

// Define a common interface for entity data that includes an 'id' and optionally 'name', 'phone' etc.
// Adjust this based on common fields used in generateQRCodeData
interface BaseEntityData {
  id: string;
  name?: string;
  phone?: string;
  // Add other potential common fields if needed
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

  // Create entity-specific QR data by merging baseData with specific fields
  let specificData = {};
  switch (entityType) {
    case 'Business':
      specificData = {
        name: data.name,
        phone: data.phone,
        // Add other relevant Business fields from 'data'
      };
      break;
    case 'Employee':
       // Assuming Employee has name and potentially other fields
       // You might need to cast 'data' or adjust BaseEntityData if Employee fields differ significantly
      specificData = {
        name: data.name, // Example: Assuming Employee has a 'name'
        // Add other relevant Employee fields from 'data'
      };
      break;
    case 'Customer':
      // Assuming Customer has name and phone
      specificData = {
        name: data.name,
        phone: data.phone,
        // Add other relevant Customer fields from 'data'
      };
      break;
    case 'Garment':
       // Garment might have different key identifiers, adjust accordingly
      specificData = {
        // Example: Add relevant Garment fields from 'data'
        // garmentType: data.garmentType, // Hypothetical field
      };
      break;
    default:
      console.warn(`QR code data generation not fully implemented for type: ${entityType}`);
  }

  // Merge base data with specific data
  const qrData = { ...baseData, ...specificData };

  // Serialize the data object into a JSON string for the QR code
  return JSON.stringify(qrData);
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

  // Add basic styling for visibility
  return (
    <View style={{ backgroundColor: 'white', padding: 10, alignSelf: 'center' }}>
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
    // This switch statement assumes 'Business', 'Employee', 'Customer', 'Garment'
    // are all valid keys within `client.models`. If any are missing,
    // it indicates a mismatch between this code and your backend schema definition
    // or the generated client types.
    switch (entityType) {
      case 'Business':
        result = await client.models.Business.get({ id: entityId });
        break;
      case 'Employee':
        // <<<--- ERROR LIKELY HERE ---<<<
        // If 'Employee' does not exist on `client.models`, it means the
        // `Employee` model is either not defined in your [amplify/data/resource.ts](cci:7://file:///Users/iggy/coding_projects/pos_dryclean/amplify/data/resource.ts:0:0-0:0)
        // schema, OR the generated types (`Schema` import) are out of date.
        result = await client.models.Employee.get({ id: entityId });
        break;
      case 'Customer':
        result = await client.models.Customer.get({ id: entityId });
        break;
      case 'Garment':
        result = await client.models.Garment.get({ id: entityId });
        break;
      default:
        console.error(`Unsupported entity type: ${entityType}`);
        return null;
    }

    // Safely convert the complex object to our expected type
    if (result && result.data) {
      // First convert to unknown, then to our target type
      return result.data as unknown as T;
    }

    return null;
  } catch (error) {
    console.error(`Error getting ${entityType} with id ${entityId}:`, error);
    return null;
  }
};

/**
 * Parses a QR code value back to an entity object
 */
export const parseQRCode = (qrValue: string): { type: EntityType, data: any } | null => {
  try {
    if (!qrValue || typeof qrValue !== 'string') {
        console.error('Invalid QR value for parsing:', qrValue);
        return null;
    }
    const parsedData = JSON.parse(qrValue);
    // Validate basic structure and type
    if (parsedData && parsedData.type && parsedData.id && ['Business', 'Employee', 'Customer', 'Garment'].includes(parsedData.type)) {
      return {
        type: parsedData.type as EntityType,
        data: parsedData // Return the whole parsed object
      };
    }
    console.error('Parsed QR data is invalid or missing required fields:', parsedData);
    return null;
  } catch (error) {
    console.error('Error parsing QR code JSON:', error);
    return null;
  }
};

/**
 * Retrieves a temporary, signed URL for a QR code stored in S3.
 */
export const getQRCodeURL = async (qrCodeKey: string): Promise<string> => {
  try {
    console.log(`Attempting to get URL for key: ${qrCodeKey}`);
    // Ensure the key includes the access level prefix if necessary (e.g., 'public/')
    // The key saved in the database should match the key used for upload.
    const getUrlResult = await getUrl({
      key: qrCodeKey,
      options: {
        // accessLevel: 'public', // Use 'public' if uploaded with public access
        // If using default (private) or 'protected', you might need targetIdentityId
        validateObjectExistence: true, // Optional: Check if object exists before generating URL
        expiresIn: 3600 // URL expires in 1 hour (adjust as needed)
      }
    });
    console.log(`Successfully got signed URL for ${qrCodeKey}:`, getUrlResult.url.href);
    return getUrlResult.url.href; // Return the generated URL string
  } catch (error) {
    console.error(`Error getting URL for QR code key ${qrCodeKey}:`, error);
    throw new Error(`Failed to get URL for QR code: ${qrCodeKey}`);
  }
};


/**
 * Generates the S3 key for a QR code image.
 * Ensures the key includes the 'public/' prefix.
 */
export const generateQRCodeS3Key = <T extends BaseEntityData>(
  entityType: EntityType,
  data: T
): string | null => {
  if (!data || !data.id) {
    console.error("Cannot generate S3 key: Entity data or ID is missing.");
    return null;
  }
  // Standardize the key format: public/qrcodes/EntityType/entityId.png
  // Using 'public/' prefix assumes you want these QR codes publicly accessible via the URL.
  // If they should be private or protected, adjust the prefix and storage access level.
  const key = `public/qrcodes/${entityType}/${data.id}.png`;
  console.log(`Generated S3 key: ${key}`);
  return key;
};


/**
 * Updates an entity record in the database with its QR code S3 key.
 */
export const attachQRCodeKeyToEntity = async (
  entityType: EntityType,
  entityId: string,
  qrCodeKey: string | null // Allow null in case key generation failed
): Promise<boolean> => {
  if (!qrCodeKey) {
    console.error(`Cannot attach null or undefined QR code key to ${entityType} ${entityId}.`);
    return false;
  }
  try {
    let result;
    // Ensure the key being saved is the one passed in (e.g., 'public/qrcodes/...')
    const updateData = { id: entityId, qrCode: qrCodeKey };

    console.log(`Attempting to attach key "${qrCodeKey}" to ${entityType} ${entityId}`);

    // Similar to getEntityData, this assumes 'Business', 'Customer', etc.
    // exist on client.models and have a 'qrCode' field in their schema.
    switch (entityType) {
      case 'Business':
        result = await client.models.Business.update(updateData);
        break;
      case 'Customer':
        // Assuming Customer model also has a qrCode field in schema
        result = await client.models.Customer.update(updateData);
        break;
      case 'Employee':
         // <<<--- ERROR LIKELY HERE TOO (if Employee model missing) ---<<<
        result = await client.models.Employee.update(updateData);
        break;
      case 'Garment':
         // Assuming Garment model also has a qrCode field in schema
        result = await client.models.Garment.update(updateData);
        break;
      default:
        console.error(`Unsupported entity type for attaching QR code key: ${entityType}`);
        return false;
    }

    // Check for errors in the update operation
    if (result && result.errors) {
      console.error(`Error updating ${entityType} ${entityId} with QR code key:`, result.errors);
      return false;
    }
    if (result && result.data) {
        console.log(`Successfully attached QR key to ${entityType} ${entityId}. Record:`, result.data);
        return true;
    }

    console.error(`Unknown error or no data returned when updating ${entityType} ${entityId}. Result:`, result);
    return false; // Indicate failure if update didn't succeed as expected

  } catch (error) {
    console.error(`Error attaching QR code key to ${entityType} ${entityId}:`, error);
    return false;
  }
};