
import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { parseItemText } from '../utils/parseItemText';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const InputArea: React.FC = () => {
  const { addItem } = useApp();
  const [itemText, setItemText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!itemText.trim()) return;
    
    const newItem = parseItemText(itemText);
    addItem(newItem);
    setItemText('');
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 mb-6">
      <div className="flex gap-2">
        <Input
          type="text"
          value={itemText}
          onChange={(e) => setItemText(e.target.value)}
          placeholder="Adicionar item (ex: 2 Arroz R$ 10,90)"
          className="flex-1"
        />
        <Button type="submit" size="icon">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <div className="mt-1 text-xs text-muted-foreground">
        Formatos: "2 Arroz R$ 10,90", "Arroz R$ 10,90", "Arroz - 2 un - R$ 10,90", "Arroz"
      </div>
    </form>
  );
};

export default InputArea;
