import React, { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../store";

// Move all selectors to top-level
// This ensures hooks are not called inside functions


interface PhoneAvailabilityOptions {
  initialPhoneNumber?: string;
  currentEntityId?: string;
  entityType?: "Business" | "Customer" | "Employee";
  debounceMs?: number;
}

/**
 * usePhoneNumberAvailability must only be called at the top level of a React function component or another custom hook.
 * Never call this inside a callback, event handler, or non-component function.
 */
export const usePhoneNumberAvailability = (options: PhoneAvailabilityOptions = {}) => {
  // Runtime check for invalid hook call
  if (typeof React === 'undefined' || typeof useState !== 'function') {
    throw new Error('usePhoneNumberAvailability must be called inside a function component or custom hook.');
  }
  // Select all entities at the top level
  const customers = useSelector((state: RootState) => state.customer.customers);
  const businesses = useSelector((state: RootState) => state.business.businesses);
  const employees = useSelector((state: RootState) => state.employee.employees);
  const {
    initialPhoneNumber = "",
    currentEntityId,
    entityType = "Customer",
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

      let existingEntities;
      switch (entityType) {
        case "Customer":
          existingEntities = customers.filter((c: { id: string; phoneNumber: string }) => c.id !== currentEntityId && c.phoneNumber === phone);
          break;
        case "Business":
          existingEntities = businesses.filter((b: { id: string; phoneNumber: string }) => b.id !== currentEntityId && b.phoneNumber === phone);
          break;
        case "Employee":
          existingEntities = employees.filter((e: { id: string; phoneNumber: string }) => e.id !== currentEntityId && e.phoneNumber === phone);
          break;
        default:
          existingEntities = [];
      }
      
      // Phone is available if it doesn't exist for other entities of the same type
      setIsAvailable(existingEntities.length === 0);
    } catch (error) {
      console.error(`Error checking phone number availability for ${entityType}:`, error);
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