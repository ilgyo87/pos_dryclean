// src/components/usePinCodeAvailability.ts
import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/api';
import { Schema } from '../../amplify/data/resource';

const client = generateClient<Schema>();

export const usePinCodeAvailability = ({
  initialPinCode,
  currentEntityId,
}: {
  initialPinCode: string;
  currentEntityId?: string;
}) => {
  const [pinCode, setPinCode] = useState(initialPinCode);
  const [isAvailable, setIsAvailable] = useState<boolean | undefined>(undefined);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    if (pinCode && pinCode.length === 4) {
      checkPinCodeAvailability(pinCode);
    } else {
      setIsAvailable(undefined);
    }
  }, [pinCode]);

  const checkPinCodeAvailability = async (pin: string) => {
    if (!pin || pin.length !== 4) {
      setIsAvailable(undefined);
      setIsChecking(false);
      return;
    }

    try {
      setIsChecking(true);
      
      // If we're editing an entity and the pin code hasn't changed
      if (currentEntityId && initialPinCode === pin) {
        setIsAvailable(true);
        setIsChecking(false);
        return;
      }

      // Check if pin code exists in Employees
      const employeeResult = await client.models.Employee.list({
        filter: { pinCode: { eq: pin } }
      });

      // If we're editing, exclude our own entity from the check
      const employeeMatches = employeeResult.data?.filter(e => e.id !== currentEntityId);

      // Pin code is available if no matches found
      setIsAvailable(employeeMatches?.length === 0);
      setIsChecking(false);
    } catch (error) {
      console.error('Error checking pin availability:', error);
      setIsAvailable(undefined);
      setIsChecking(false);
    }
  };

  const getPinInputStyle = () => {
    if (isAvailable === true) return { borderColor: '#4CAF50' }; // Green for valid
    if (isAvailable === false) return { borderColor: '#E53935' }; // Red for invalid
    return {}; // Default style
  };

  const getPinStatusText = () => {
    if (isChecking) return { text: 'Checking...', color: '#FFA000' };
    if (isAvailable === true) return { text: 'Available', color: '#4CAF50' };
    if (isAvailable === false) return { text: 'Already in use', color: '#E53935' };
    return { text: '', color: 'transparent' };
  };

  return {
    pinCode,
    setPinCode,
    isAvailable,
    isChecking,
    getPinInputStyle,
    getPinStatusText
  };
};