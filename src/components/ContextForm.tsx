import { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { useTaskStore } from '../store/useTaskStore';
import type { Context } from '../types';

const PRESET_ICONS = [
  'Home', 'Building', 'Globe', 'WifiOff', 'Phone', 'Laptop',
  'Coffee', 'Walk', 'Car', 'Plane', 'Users', 'Star',
];

interface ContextFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editContext?: Context | null;
}

export function ContextForm({ open, onOpenChange, editContext }: ContextFormProps) {
  const { contextActions } = useTaskStore();
  
  const [name, setName] = useState('');
  const [icon, setIcon] = useState(PRESET_ICONS[0]);

  useEffect(() => {
    if (editContext) {
      setName(editContext.name);
      setIcon(editContext.icon || PRESET_ICONS[0]);
    } else {
      setName('');
      setIcon(PRESET_ICONS[0]);
    }
  }, [editContext]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editContext) {
      await contextActions.update(editContext.id, { 
        name: name.trim(), 
        icon 
      });
    } else {
      await contextActions.add({ name: name.trim(), icon });
    }

    setName('');
    setIcon(PRESET_ICONS[0]);
    onOpenChange(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-xl shadow-xl z-50 p-6">
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="text-xl font-semibold text-slate-800">
              {editContext ? 'Edit Context' : 'New Context'}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button type="button" className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="context-name" className="block text-sm font-medium text-slate-700 mb-1">
                Name
              </label>
              <input
                id="context-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., home, office, commute"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <span className="block text-sm font-medium text-slate-700 mb-2">Icon</span>
              <div className="flex flex-wrap gap-2">
                {PRESET_ICONS.map((i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setIcon(i)}
                    className={`
                      px-3 py-2 rounded-lg text-sm font-medium transition-colors
                      ${icon === i 
                        ? 'bg-slate-700 text-white' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}
                    `}
                  >
                    {i}
                  </button>
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
                {editContext ? 'Save' : 'Create'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
