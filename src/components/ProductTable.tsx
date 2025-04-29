import React from 'react';
import { useApp } from '../contexts/AppContext';
import { ShoppingItem } from '../types';
import { Check, Trash2, ArrowDown, ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';

const ProductTable: React.FC = () => {
  const {
    getSortedItems,
    toggleItemCheck,
    updateItem,
    deleteItem,
    formatCurrency,
    sortOption,
    sortDirection,
    updateSortOption,
    updateSortDirection
  } = useApp();

  const items = getSortedItems();

  const handleToggleSort = (option: 'name' | 'price' | 'quantity') => {
    if (sortOption === option) {
      updateSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      updateSortOption(option);
      updateSortDirection('asc');
    }
  };

  const getSortIcon = (option: 'name' | 'price' | 'quantity') => {
    if (sortOption !== option) return null;
    
    return sortDirection === 'asc' ? (
      <ArrowUp className="h-3 w-3 inline-block ml-1" />
    ) : (
      <ArrowDown className="h-3 w-3 inline-block ml-1" />
    );
  };

  const handleQuantityChange = (item: ShoppingItem, value: string) => {
    const quantity = parseInt(value) || 0;
    updateItem(item.id, { quantity });
  };

  const handlePriceChange = (item: ShoppingItem, value: string) => {
    const cleanValue = value.replace(/[^\d,.]/g, '').replace(',', '.');
    updateItem(item.id, { price: parseFloat(cleanValue) || 0 });
  };

  if (items.length === 0) {
    return (
      <div className="py-10 text-center text-muted-foreground">
        Sua lista está vazia. Adicione itens acima.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto pb-4">
      <table className="w-full border-collapse">
        <thead>
          <tr className="text-xs text-left border-b border-border">
            <th className="py-2 pl-1 pr-2 w-10"></th>
            <th className="py-2 px-2">
              <button 
                onClick={() => handleToggleSort('name')}
                className="flex items-center font-medium hover:text-primary text-left"
              >
                Item {getSortIcon('name')}
              </button>
            </th>
            <th className="py-2 px-2 w-16">
              <button 
                onClick={() => handleToggleSort('quantity')}
                className="flex items-center font-medium hover:text-primary"
              >
                Qtd {getSortIcon('quantity')}
              </button>
            </th>
            <th className="py-2 px-2 w-24">
              <button 
                onClick={() => handleToggleSort('price')}
                className="flex items-center font-medium hover:text-primary"
              >
                Preço {getSortIcon('price')}
              </button>
            </th>
            <th className="py-2 px-2 w-24 text-right">Total</th>
            <th className="py-2 px-2 w-10"></th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr 
              key={item.id} 
              className={`text-sm border-b border-border hover:bg-secondary/20 ${
                item.checked ? 'text-muted-foreground' : ''
              }`}
            >
              <td className="py-2 pl-1 pr-2">
                <Checkbox
                  checked={item.checked}
                  onCheckedChange={() => toggleItemCheck(item.id)}
                  className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                />
              </td>
              <td className="py-2 px-2">
                <span className={item.checked ? 'line-through' : ''}>
                  {item.name}
                </span>
              </td>
              <td className="py-2 px-2">
                <Input
                  type="text"
                  value={item.quantity}
                  onChange={(e) => handleQuantityChange(item, e.target.value)}
                  min="0"
                  className="w-16 h-8 px-2 py-1"
                />
              </td>
              <td className="py-2 px-2">
                <Input
                  type="text"
                  value={item.price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  onChange={(e) => handlePriceChange(item, e.target.value)}
                  className="w-20 h-8 px-2 py-1"
                  placeholder="0,00"
                />
              </td>
              <td className="py-2 px-2 text-right">
                {formatCurrency(item.price * item.quantity)}
              </td>
              <td className="py-2 px-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteItem(item.id)}
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ProductTable;
