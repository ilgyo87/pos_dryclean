// src/components/usePinCodeAvailability.ts
import { useSelector } from "react-redux";
import type { RootState } from "../store";
import { isPinCodeAvailable } from "../store/slices/PinCodeAvailability";

// Utility selector for use in hooks/components
export function usePinCodeAvailability(pinCode: string, excludeEmployeeId?: string): boolean {
  return useSelector((state: RootState) =>
    isPinCodeAvailable(state, pinCode, excludeEmployeeId)
  );
}