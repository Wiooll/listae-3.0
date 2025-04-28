
import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Edit, Check } from 'lucide-react';

interface ListsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ListsModal: React.FC<ListsModalProps> = ({ isOpen, onClose }) => {
  const { lists, activeList, addList, setActiveList, updateList, deleteList } = useApp();
  
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [editedName, setEditedName] = useState('');
  
  const handleEditList = (listId: string, currentName: string) => {
    setEditingListId(listId);
    setEditedName(currentName);
  };
  
  const handleSaveEdit = (listId: string) => {
    if (editedName.trim()) {
      const listToUpdate = lists.find(list => list.id === listId);
      if (listToUpdate) {
        updateList({ ...listToUpdate, name: editedName.trim() });
      }
    }
    setEditingListId(null);
  };
  
  const handleDeleteList = (listId: string) => {
    if (lists.length <= 1) {
      alert('Você não pode excluir a única lista existente.');
      return;
    }
    
    if (confirm('Tem certeza que deseja excluir esta lista?')) {
      deleteList(listId);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Gerenciar Listas</DialogTitle>
        </DialogHeader>
        
        <div className="py-4 max-h-[60vh] overflow-y-auto">
          {lists.map(list => (
            <div
              key={list.id}
              className={`flex items-center justify-between p-3 rounded-md mb-2 ${
                list.id === activeList.id
                  ? 'bg-primary/10 border border-primary/30'
                  : 'hover:bg-secondary/50'
              }`}
            >
              {editingListId === list.id ? (
                <div className="flex flex-1 items-center gap-2">
                  <Input
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    autoFocus
                    className="flex-1"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSaveEdit(list.id)}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <button
                    className="flex-1 text-left py-1 px-2 rounded-md hover:bg-secondary/50"
                    onClick={() => setActiveList(list.id)}
                  >
                    <div className="font-medium">{list.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(list.updatedAt).toLocaleDateString('pt-BR')} • 
                      {list.items.length} {list.items.length === 1 ? 'item' : 'itens'}
                    </div>
                  </button>
                  
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEditList(list.id, list.name)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => handleDeleteList(list.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
        
        <DialogFooter className="flex justify-between items-center">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
          <Button onClick={addList}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Lista
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ListsModal;
