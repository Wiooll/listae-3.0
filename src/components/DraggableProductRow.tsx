
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { MoveVertical } from 'lucide-react';

interface DraggableProductRowProps {
  id: string;
  children: React.ReactNode;
}

const DraggableProductRow: React.FC<DraggableProductRowProps> = ({ id, children }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <tr ref={setNodeRef} style={style} {...attributes}>
      <td className="w-8 p-2">
        <button
          type="button"
          className="cursor-move opacity-50 hover:opacity-100"
          {...listeners}
        >
          <MoveVertical className="w-4 h-4" />
        </button>
      </td>
      {children}
    </tr>
  );
};

export default DraggableProductRow;
