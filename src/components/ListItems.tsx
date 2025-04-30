import { useItems } from '@/hooks/queries/useItems';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { EditableItemName } from './EditableItemName';

interface ListItemsProps {
  listId: string;
}

export function ListItems({ listId }: ListItemsProps) {
  const [newItemName, setNewItemName] = useState('');
  
  const {
    items,
    isLoading,
    isError,
    createItem,
    updateItem,
    deleteItem,
    toggleChecked,
    isCreating,
    isUpdating,
    isDeleting
  } = useItems(listId);

  const handleCreateItem = () => {
    if (!newItemName.trim()) return;

    createItem({
      list_id: listId,
      name: newItemName.trim(),
      checked: false,
      quantity: 1,
      price: 0
    });

    setNewItemName('');
  };

  const handleToggleCheck = (id: string, checked: boolean) => {
    toggleChecked({ id, checked });
  };

  const handleUpdateName = (id: string, name: string) => {
    updateItem({
      id,
      updates: { name }
    });
  };

  const handleUpdatePrice = (id: string, price: string) => {
    const numPrice = parseFloat(price);
    if (isNaN(numPrice)) return;

    updateItem({
      id,
      updates: { price: numPrice }
    });
  };

  const handleUpdateQuantity = (id: string, quantity: string) => {
    const numQuantity = parseInt(quantity);
    if (isNaN(numQuantity)) return;

    updateItem({
      id,
      updates: { quantity: numQuantity }
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4 text-red-500">
        Erro ao carregar itens. Por favor, tente novamente.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Formulário para adicionar novo item */}
      <div className="flex gap-2">
        <Input
          placeholder="Novo item..."
          value={newItemName}
          onChange={(e) => setNewItemName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCreateItem()}
          disabled={isCreating}
        />
        <Button 
          onClick={handleCreateItem}
          disabled={isCreating || !newItemName.trim()}
        >
          {isCreating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            'Adicionar'
          )}
        </Button>
      </div>

      {/* Lista de itens */}
      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-4 p-2 rounded-lg border group"
          >
            <Checkbox
              checked={item.checked}
              onCheckedChange={(checked) => 
                handleToggleCheck(item.id, checked as boolean)
              }
            />
            
            <EditableItemName
              name={item.name}
              checked={item.checked}
              isUpdating={isUpdating}
              onUpdate={(newName) => handleUpdateName(item.id, newName)}
            />

            <div className="ml-auto flex items-center gap-2">
              <Input
                type="number"
                value={item.quantity}
                onChange={(e) => handleUpdateQuantity(item.id, e.target.value)}
                className="w-20"
                min={1}
              />

              <Input
                type="number"
                value={item.price}
                onChange={(e) => handleUpdatePrice(item.id, e.target.value)}
                className="w-24"
                min={0}
                step={0.01}
              />

              <Button
                variant="destructive"
                size="icon"
                onClick={() => deleteItem(item.id)}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  '×'
                )}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="flex justify-end text-lg font-semibold">
        Total: R$ {items.reduce((acc, item) => acc + (item.price * item.quantity), 0).toFixed(2)}
      </div>
    </div>
  );
} 