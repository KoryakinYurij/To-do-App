import { Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useTaskStore } from '../store/useTaskStore';
import type { Tag } from '../types';

interface TagListProps {
  onEdit: (tag: Tag) => void;
}

export function TagList({ onEdit }: TagListProps) {
  const { tags, tagActions, tasks } = useTaskStore();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const getTaskCount = (tagId: string) => {
    return tasks.filter(t => t.tagIds.includes(tagId)).length;
  };

  const handleDelete = async (id: string) => {
    if (deletingId === id) {
      await tagActions.delete(id);
      setDeletingId(null);
    } else {
      setDeletingId(id);
      setTimeout(() => setDeletingId(null), 3000);
    }
  };

  if (tags.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        No tags yet
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {tags.map(tag => {
        const taskCount = getTaskCount(tag.id);

        return (
          <div 
            key={tag.id}
            className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-lg"
          >
            <div className="flex items-center gap-3">
              <div 
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: tag.color }}
              />
              <div>
                <h3 className="font-medium text-slate-800">{tag.name}</h3>
                <p className="text-sm text-slate-500">{taskCount} tasks</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onEdit(tag)}
                className="p-2 hover:bg-slate-100 rounded-lg text-slate-500"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => handleDelete(tag.id)}
                className={`p-2 rounded-lg ${
                  deletingId === tag.id 
                    ? 'bg-red-100 text-red-600' 
                    : 'hover:bg-slate-100 text-slate-500'
                }`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
