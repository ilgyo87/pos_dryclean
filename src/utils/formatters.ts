// src/utils/formatters.ts
export const formatCurrency = (amount: number): string => {
    return `$${amount.toFixed(2)}`;
  };
  
  export const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };
  
  export const formatPaymentMethod = (method: string): string => {
    return method
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  };