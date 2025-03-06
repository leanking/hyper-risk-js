import { ethers } from 'ethers';

/**
 * Validates if a string is a valid Ethereum address
 * @param address The address to validate
 * @returns True if the address is valid, false otherwise
 */
export const isValidEthereumAddress = (address: string): boolean => {
  try {
    return ethers.isAddress(address);
  } catch (error) {
    return false;
  }
};

/**
 * Formats a number as a currency string
 * @param value The value to format
 * @param currency The currency symbol (default: $)
 * @param decimals The number of decimal places (default: 2)
 * @returns The formatted currency string
 */
export const formatCurrency = (
  value: string | number,
  currency = '$',
  decimals = 2
): string => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) {
    return `${currency}0.00`;
  }
  
  return `${currency}${numValue.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
};

/**
 * Formats a number as a percentage string
 * @param value The value to format
 * @param decimals The number of decimal places (default: 2)
 * @returns The formatted percentage string
 */
export const formatPercentage = (
  value: string | number,
  decimals = 2
): string => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) {
    return '0.00%';
  }
  
  return `${numValue.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}%`;
};

/**
 * Truncates a string to a specified length
 * @param str The string to truncate
 * @param maxLength The maximum length (default: 10)
 * @returns The truncated string
 */
export const truncateString = (str: string, maxLength = 10): string => {
  if (!str) return '';
  if (str.length <= maxLength) return str;
  
  const prefixLength = Math.ceil(maxLength / 2);
  const suffixLength = Math.floor(maxLength / 2) - 1;
  
  return `${str.substring(0, prefixLength)}...${str.substring(str.length - suffixLength)}`;
};

/**
 * Formats a timestamp as a date string
 * @param timestamp The timestamp to format
 * @param format The format to use (default: 'short')
 * @returns The formatted date string
 */
export const formatDate = (
  timestamp: number | Date,
  format: 'short' | 'medium' | 'long' = 'short'
): string => {
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  
  if (isNaN(date.getTime())) {
    return 'Invalid Date';
  }
  
  switch (format) {
    case 'short':
      return date.toLocaleDateString();
    case 'medium':
      return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
    case 'long':
      return date.toISOString();
    default:
      return date.toLocaleDateString();
  }
};

/**
 * Calculates the percentage change between two values
 * @param currentValue The current value
 * @param previousValue The previous value
 * @returns The percentage change
 */
export const calculatePercentageChange = (
  currentValue: string | number,
  previousValue: string | number
): number => {
  const current = typeof currentValue === 'string' ? parseFloat(currentValue) : currentValue;
  const previous = typeof previousValue === 'string' ? parseFloat(previousValue) : previousValue;
  
  if (isNaN(current) || isNaN(previous) || previous === 0) {
    return 0;
  }
  
  return ((current - previous) / Math.abs(previous)) * 100;
};

/**
 * Calculates the PNL (Profit and Loss) between two values
 * @param currentValue The current value
 * @param entryValue The entry value
 * @param quantity The quantity
 * @returns The PNL
 */
export const calculatePnl = (
  currentValue: string | number,
  entryValue: string | number,
  quantity: string | number
): number => {
  const current = typeof currentValue === 'string' ? parseFloat(currentValue) : currentValue;
  const entry = typeof entryValue === 'string' ? parseFloat(entryValue) : entryValue;
  const qty = typeof quantity === 'string' ? parseFloat(quantity) : quantity;
  
  if (isNaN(current) || isNaN(entry) || isNaN(qty)) {
    return 0;
  }
  
  return (current - entry) * qty;
};

/**
 * Generates a pagination object
 * @param total The total number of items
 * @param page The current page
 * @param limit The number of items per page
 * @returns The pagination object
 */
export const generatePagination = (
  total: number,
  page: number,
  limit: number
) => {
  const pages = Math.ceil(total / limit);
  
  return {
    total,
    page,
    limit,
    pages,
  };
}; 