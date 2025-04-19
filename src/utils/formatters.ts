// src/utils/formatters.ts

/**
 * Formats a number as currency with dollar sign and two decimal places
 * @param amount The number to format as currency
 * @returns Formatted currency string
 */
export const formatCurrency = (amount: number): string => {
  return `$${amount.toFixed(2)}`;
};

/**
 * Formats a date string into a human-readable format
 * @param dateString ISO date string to format
 * @returns Formatted date string
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { 
    weekday: "short",
    month: "short", 
    day: "numeric",
    year: "numeric"
  });
};

/**
 * Formats a payment method string to be more readable
 * @param method Payment method string (often with underscores)
 * @returns Formatted payment method string
 */
export const formatPaymentMethod = (method: string): string => {
  return method
    .replace(/_/g, " ")
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};