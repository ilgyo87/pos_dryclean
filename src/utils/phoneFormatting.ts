// src/utils/phoneFormatting.ts
/**
 * Normalizes a phone number by removing all non-digit characters
 * @param phoneNumber - Input phone number which may contain special characters
 * @returns Plain 10-digit phone number with no formatting
 */
export const normalizePhoneNumber = (phoneNumber: string): string => {
    if (!phoneNumber) return '';
    
    // Remove all non-digit characters
    return phoneNumber.replace(/\D/g, '');
  };
  
  /**
   * Formats a normalized phone number for display
   * @param phoneNumber - Normalized phone number (10 digits)
   * @returns Formatted phone number (XXX) XXX-XXXX
   */
  export const formatPhoneForDisplay = (phoneNumber: string): string => {
    const normalized = normalizePhoneNumber(phoneNumber);
    
    if (normalized.length < 10) return normalized;
    
    const areaCode = normalized.substring(0, 3);
    const firstPart = normalized.substring(3, 6);
    const secondPart = normalized.substring(6, 10);
    
    return `(${areaCode}) ${firstPart}-${secondPart}`;
  };