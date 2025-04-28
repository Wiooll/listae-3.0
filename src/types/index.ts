
export interface ShoppingItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  checked: boolean;
  createdAt: number;
}

export interface ShoppingList {
  id: string;
  name: string;
  items: ShoppingItem[];
  createdAt: number;
  updatedAt: number;
}

export type SortOption = 'name' | 'price' | 'quantity';
export type SortDirection = 'asc' | 'desc';
export type Currency = 'BRL' | 'USD' | 'EUR';
export type ThemeMode = 'light' | 'dark' | 'system';

export interface AppSettings {
  theme: ThemeMode;
  currency: Currency;
  defaultSort: SortOption;
  defaultSortDirection: SortDirection;
}
