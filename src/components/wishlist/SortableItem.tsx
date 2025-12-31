'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { WishlistItemCard } from './WishlistItemCard';
import type { WishlistItem } from '@/types';

interface SortableItemProps {
  item: WishlistItem;
  isOwner: boolean;
  hidePurchased: boolean;
  onUpdate: () => void;
  rank: number;
}

export function SortableItem({ item, isOwner, hidePurchased, onUpdate, rank }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative flex items-start gap-2">
      {isOwner && (
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-2 hover:bg-gray-100 rounded flex-shrink-0 mt-2"
        >
          <GripVertical className="h-5 w-5 text-gray-400" />
        </div>
      )}
      <div className="relative flex-1">
        {isOwner && (
          <div className="absolute -top-2 -left-2 bg-green-600 text-white rounded-full w-10 h-10 flex items-center justify-center text-sm font-bold z-10 shadow-md border-2 border-white">
            {rank}
          </div>
        )}
        <WishlistItemCard
          item={item}
          isOwner={isOwner}
          hidePurchased={hidePurchased}
          onUpdate={onUpdate}
        />
      </div>
    </div>
  );
}
