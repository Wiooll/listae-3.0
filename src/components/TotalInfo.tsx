
import React from 'react';
import { useApp } from '../contexts/AppContext';

const TotalInfo: React.FC = () => {
  const { getTotal, getCheckedTotal, formatCurrency } = useApp();
  
  const total = getTotal();
  const checkedTotal = getCheckedTotal();
  const uncheckedTotal = total - checkedTotal;
  
  return (
    <div className="mt-4 mb-6 bg-secondary/30 rounded-lg p-4">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-muted-foreground">Itens não comprados:</span>
        <span className="font-medium">{formatCurrency(uncheckedTotal)}</span>
      </div>
      
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-muted-foreground">Itens comprados:</span>
        <span className="font-medium">{formatCurrency(checkedTotal)}</span>
      </div>
      
      <div className="flex justify-between items-center pt-2 border-t border-border">
        <span className="text-sm font-medium">Total:</span>
        <span className="text-lg font-bold text-primary">{formatCurrency(total)}</span>
      </div>
    </div>
  );
};

export default TotalInfo;
