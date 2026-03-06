import { useState } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Check, Plus } from 'lucide-react';
import { useTaskStore } from '../store/useTaskStore';
import { ContextForm } from './ContextForm';

const ICON_MAP: Record<string, string> = {
  Home: '🏠',
  Building: '🏢',
  Globe: '🌐',
  WifiOff: '📵',
  Phone: '📞',
  Laptop: '💻',
  Coffee: '☕',
  Walk: '🚶',
  Car: '🚗',
  Plane: '✈️',
  Users: '👥',
  Star: '⭐',
};

export function ContextSelector() {
  const { contexts, currentContext, contextActions } = useTaskStore();
  const [isFormOpen, setFormOpen] = useState(false);

  const selectedContext = contexts.find(c => c.id === currentContext);

  return (
    <>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button
            type="button"
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <span>{selectedContext ? ICON_MAP[selectedContext.icon || ''] || '📍' : '📍'}</span>
            <span className="text-slate-700">
              {selectedContext ? `@${selectedContext.name}` : 'All Contexts'}
            </span>
          </button>
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content 
            className="min-w-[200px] bg-white rounded-lg shadow-lg border border-slate-200 p-1 z-50"
            sideOffset={5}
          >
            <DropdownMenu.Item
              className="px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded cursor-pointer outline-none"
              onClick={() => contextActions.setCurrentContext(null)}
            >
              <span className="flex items-center justify-between">
                All Contexts
                {currentContext === null && <Check className="w-4 h-4" />}
              </span>
            </DropdownMenu.Item>

            <DropdownMenu.Separator className="h-px bg-slate-200 my-1" />

            {contexts.map(context => (
              <DropdownMenu.Item
                key={context.id}
                className="px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded cursor-pointer outline-none"
                onClick={() => contextActions.setCurrentContext(context.id)}
              >
                <span className="flex items-center justify-between gap-2">
                  <span>{ICON_MAP[context.icon || ''] || '📍'} @{context.name}</span>
                  {currentContext === context.id && <Check className="w-4 h-4" />}
                </span>
              </DropdownMenu.Item>
            ))}

            <DropdownMenu.Separator className="h-px bg-slate-200 my-1" />

            <DropdownMenu.Item
              className="px-3 py-2 text-sm text-blue-600 hover:bg-slate-100 rounded cursor-pointer outline-none"
              onClick={() => setFormOpen(true)}
            >
              <Plus className="w-4 h-4 inline mr-2" />
              Add Context
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      <ContextForm open={isFormOpen} onOpenChange={setFormOpen} />
    </>
  );
}
