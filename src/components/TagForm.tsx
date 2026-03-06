import { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { useTaskStore } from '../store/useTaskStore';
import type { Tag } from '../types';

const PRESET_COLORS = [
  '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6',
  '#06b6d4', '#ec4899', '#84cc16', '#6366f1', '#14b8a6',
];

interface TagFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editTag?: Tag | null;
}

export function TagForm({ open, onOpenChange, editTag }: TagFormProps) {
  const { tagActions } = useTaskStore();
  
  const [name, setName] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0]);

  useEffect(() => {
    if (editTag) {
      setName(editTag.name);
      setColor(editTag.color);
    } else {
      setName('');
      setColor(PRESET_COLORS[0]);
    }
  }, [editTag]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editTag) {
      await tagActions.update(editTag.id, { 
        name: name.trim(), 
        color 
      });
    } else {
      await tagActions.add({ name: name.trim(), color });
    }

    setName('');
    setColor(PRESET_COLORS[0]);
    onOpenChange(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-xl shadow-xl z-50 p-6">
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="text-xl font-semibold text-slate-800">
              {editTag ? 'Edit Tag' : 'New Tag'}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button type="button" className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="tag-name" className="block text-sm font-medium text-slate-700 mb-1">
                Name
              </label>
              <input
                id="tag-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tag name"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <span className="block text-sm font-medium text-slate-700 mb-2">Color</span>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`
                      w-8 h-8 rounded-full transition-transform
                      ${color === c ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : 'hover:scale-110'}
                    `}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Dialog.Close asChild>
                <button 
                  type="button"
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
              </Dialog.Close>
              <button 
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {editTag ? 'Save' : 'Create'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
