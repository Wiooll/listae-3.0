
import { generateId } from '../services/localStorageService';

interface ParsedItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  checked: boolean;
  createdAt: number;
}

// Parses input text into a shopping item object
export const parseItemText = (text: string): ParsedItem => {
  // Default values
  let name = text.trim();
  let quantity = 1;
  let price = 0;
  
  // Regular expressions to match different formats
  const quantityAtStartRegex = /^(\d+)\s+(.*?)(?:\s+R?\$\s*(\d+[.,]?\d*))?$/i;
  const priceAtEndRegex = /^(.*?)(?:\s+R?\$\s*(\d+[.,]?\d*))?$/i;
  const dashFormatRegex = /^(.*?)\s*-\s*(\d+)\s*un\s*-\s*R?\$\s*(\d+[.,]?\d*)$/i;
  
  // Try to match quantity at start: "2 Arroz R$ 10,90"
  const quantityMatch = text.match(quantityAtStartRegex);
  if (quantityMatch) {
    quantity = parseInt(quantityMatch[1]) || 1;
    name = quantityMatch[2].trim();
    price = parseFloat((quantityMatch[3] || '0').replace(',', '.')) || 0;
    return createItem(name, quantity, price);
  }
  
  // Try to match dash format: "Arroz - 2 un - R$ 10,90"
  const dashMatch = text.match(dashFormatRegex);
  if (dashMatch) {
    name = dashMatch[1].trim();
    quantity = parseInt(dashMatch[2]) || 1;
    price = parseFloat((dashMatch[3] || '0').replace(',', '.')) || 0;
    return createItem(name, quantity, price);
  }
  
  // Try to match price at end: "Arroz R$ 10,90"
  const priceMatch = text.match(priceAtEndRegex);
  if (priceMatch) {
    name = priceMatch[1].trim();
    price = parseFloat((priceMatch[2] || '0').replace(',', '.')) || 0;
    return createItem(name, quantity, price);
  }
  
  // If no special format, just use the text as name
  return createItem(name, quantity, price);
};

// Helper to create an item with the parsed values
const createItem = (name: string, quantity: number, price: number): ParsedItem => {
  return {
    id: generateId(),
    name,
    quantity,
    price,
    checked: false,
    createdAt: Date.now()
  };
};
