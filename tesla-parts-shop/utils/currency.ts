import { Currency } from '../types';

export const formatCurrency = (amount: number, currency: Currency): string => {
  const truncatedAmount = Math.floor(amount);
  return new Intl.NumberFormat('uk-UA', {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(truncatedAmount);
};
