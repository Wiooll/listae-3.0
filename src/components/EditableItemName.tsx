import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Pencil, Check, X } from 'lucide-react';

interface EditableItemNameProps {
  name: string;
  checked: boolean;
  isUpdating: boolean;
  onUpdate: (newName: string) => void;
}

export function EditableItemName({ name, checked, isUpdating, onUpdate }: EditableItemNameProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleStartEdit = () => {
    setEditValue(name);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditValue(name);
    setIsEditing(false);
  };

  const handleSave = () => {
    const trimmedValue = editValue.trim();
    if (trimmedValue && trimmedValue !== name) {
      onUpdate(trimmedValue);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <Input
          ref={inputRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          disabled={isUpdating}
          className="h-8"
        />
        <div className="flex gap-1">
          <Button
            size="icon"
            variant="ghost"
            onClick={handleSave}
            disabled={isUpdating || !editValue.trim() || editValue.trim() === name}
            className="h-8 w-8"
          >
            <Check className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={handleCancel}
            disabled={isUpdating}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 flex-1 min-w-0">
      <span className={checked ? 'line-through text-muted-foreground' : ''}>
        {name}
      </span>
      <Button
        size="icon"
        variant="ghost"
        onClick={handleStartEdit}
        disabled={isUpdating}
        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Pencil className="h-4 w-4" />
      </Button>
    </div>
  );
} 