// src/store/slices/PinCodeAvailability.ts
import type { RootState } from "../index";

/**
 * Checks if a given pin code is available (not taken by another employee).
 * @param state - The Redux root state
 * @param pinCode - The 4-digit pin code to check
 * @param excludeEmployeeId - Optionally exclude this employee ID (for edit mode)
 * @returns true if available, false if taken
 */
export function isPinCodeAvailable(
  state: RootState,
  pinCode: string,
  excludeEmployeeId?: string
): boolean {
  if (!pinCode || pinCode.length !== 4) return false;
  const employees = state.employee.employees;
  return !employees.some(
    (e) => e.pinCode === pinCode && e.id !== excludeEmployeeId
  );
}

export default isPinCodeAvailable;
