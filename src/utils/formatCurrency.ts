
import { Currency } from '../types';

export const formatCurrency = (value: number, currency: Currency): string => {
  if (isNaN(value)) return '—';
  
  const options: Intl.NumberFormatOptions = {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  };
  
  const formatter = new Intl.NumberFormat('pt-BR', options);
  return formatter.format(value);
};
