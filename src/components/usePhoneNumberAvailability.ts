import { useState, useEffect, useRef } from 'react';
import { generateClient } from 'aws-amplify/api';
import type { Schema } from '../../amplify/data/resource';

const client = generateClient<Schema>();

interface PhoneAvailabilityOptions {
  initialPhoneNumber?: string;
  currentEntityId?: string;
  entityType?: 'Business' | 'Customer' | 'Employee';
  debounceMs?: number;
}

export const usePhoneNumberAvailability = (options: PhoneAvailabilityOptions = {}) => {
  const {
    initialPhoneNumber = '',
    currentEntityId,
    entityType,
    debounceMs = 500
  } = options;

  const [phoneNumber, setPhoneNumber] = useState(initialPhoneNumber);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const phoneCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const checkPhoneNumberAvailability = async (phone: string) => {
    if (!phone || phone.length < 10) {
      setIsAvailable(null);
      return;
    }

    try {
      setIsChecking(true);
      
      // If we're editing an entity and the phone number hasn't changed
      if (currentEntityId && initialPhoneNumber === phone) {
        setIsAvailable(true);
        setIsChecking(false);
        return;
      }

      // Check if phone number exists in Businesses
      const businessResult = await client.models.Business.list({
        filter: { phoneNumber: { eq: phone } }
      });
      
      // Check if phone number exists in Customers
      const customerResult = await client.models.Customer.list({
        filter: { phoneNumber: { eq: phone } }
      });
      
      // Check if phone number exists in Employees
      const employeeResult = await client.models.Employee.list({
        filter: { phoneNumber: { eq: phone } }
      });

      // If we're editing, exclude our own entity from the check
      const businessMatches = businessResult.data?.filter(b => 
        !(entityType === 'Business' && b.id === currentEntityId)
      ) || [];
      
      const customerMatches = customerResult.data?.filter(c => 
        !(entityType === 'Customer' && c.id === currentEntityId)
      ) || [];
      
      const employeeMatches = employeeResult.data?.filter(e => 
        !(entityType === 'Employee' && e.id === currentEntityId)
      ) || [];
      
      // Phone is available if it doesn't exist in any of the tables
      // or it only exists for the current entity being edited
      const isPhoneAvailable = 
        businessMatches.length === 0 && 
        customerMatches.length === 0 && 
        employeeMatches.length === 0;
      
      setIsAvailable(isPhoneAvailable);
    } catch (error) {
      console.error("Error checking phone number availability:", error);
      setIsAvailable(null);
    } finally {
      setIsChecking(false);
    }
  };

  // Debounced check when the phone number changes
  useEffect(() => {
    if (phoneCheckTimeoutRef.current) {
      clearTimeout(phoneCheckTimeoutRef.current);
    }
    
    if (phoneNumber.length >= 10) {
      phoneCheckTimeoutRef.current = setTimeout(() => {
        checkPhoneNumberAvailability(phoneNumber);
      }, debounceMs);
    } else {
      setIsAvailable(null);
    }
    
    return () => {
      if (phoneCheckTimeoutRef.current) {
        clearTimeout(phoneCheckTimeoutRef.current);
      }
    };
  }, [phoneNumber, currentEntityId]);

  // Helpers for styles and text based on availability state
  const getPhoneInputStyle = (baseStyle: any, availableStyle: any, unavailableStyle: any, checkingStyle: any) => {
    if (isChecking) return { ...baseStyle, ...checkingStyle };
    if (isAvailable === true) return { ...baseStyle, ...availableStyle };
    if (isAvailable === false) return { ...baseStyle, ...unavailableStyle };
    return baseStyle;
  };

  const getPhoneStatusText = (checking: string, available: string, unavailable: string) => {
    if (isChecking) return checking;
    if (isAvailable === true) return available;
    if (isAvailable === false) return unavailable;
    return "";
  };

  return {
    phoneNumber,
    setPhoneNumber,
    isAvailable,
    isChecking,
    checkPhoneNumberAvailability,
    getPhoneInputStyle,
    getPhoneStatusText
  };
};