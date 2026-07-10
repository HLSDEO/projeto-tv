import { useState, useEffect } from 'react';
import MediaItem from './MediaItem';

export default function MediaList({ media, onUpdate, onDelete, onReorder, baseURL }) {
  const [items, setItems] = useState([]);
  const [draggedIndex, setDraggedIndex] = useState(null);

  // Synchronize local items state with the media prop when it changes
  useEffect(() => {
    setItems(media);
  }, [media]);

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    // Fluid local reordering for instant visual feedback
    const reorderedItems = [...items];
    const draggedItem = reorderedItems[draggedIndex];
    
    // Swap positions
    reorderedItems.splice(draggedIndex, 1);
    reorderedItems.splice(index, 0, draggedItem);
    
    setDraggedIndex(index);
    setItems(reorderedItems);
  };

  const handleDragEnd = async () => {
    if (draggedIndex === null) return;
    setDraggedIndex(null);
    
    const orderedIds = items.map(item => item.id);
    if (onReorder) {
      await onReorder(orderedIds);
    }
  };

  return (
    <div className="bg-zinc-800 p-6 rounded-xl border border-zinc-700">
      <h2 className="text-xl font-semibold mb-6">Mídias Cadastradas</h2>
      <div className="space-y-4">
        {items.map((m, idx) => (
          <div
            key={m.id}
            draggable
            onDragStart={(e) => handleDragStart(e, idx)}
            onDragOver={(e) => handleDragOver(e, idx)}
            onDragEnd={handleDragEnd}
            className={`transition-all duration-200 ${
              draggedIndex === idx 
                ? 'opacity-40 scale-[0.98] border border-dashed border-blue-500 rounded-lg' 
                : ''
            }`}
          >
            <MediaItem
              m={m}
              onUpdate={onUpdate}
              onDelete={onDelete}
              baseURL={baseURL}
            />
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-center text-zinc-500 py-8">Nenhuma mídia cadastrada ainda.</p>
        )}
      </div>
    </div>
  );
}
