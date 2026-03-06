import { v4 as uuidv4 } from 'uuid';
import { db } from '../../db';
import type { Context } from '../../types';
import type { StateCreator } from 'zustand';

export interface ContextSlice {
  contexts: Context[];
  currentContext: string | null;
  contextActions: {
    getAll: () => Promise<void>;
    add: (context: Omit<Context, 'id'>) => Promise<Context>;
    update: (id: string, updates: Partial<Context>) => Promise<void>;
    delete: (id: string) => Promise<void>;
    setCurrentContext: (contextId: string | null) => void;
  };
}

export const createContextSlice: StateCreator<ContextSlice & { taskActions: { getAll: () => Promise<void> } }, [], [], ContextSlice> = (set, get) => ({
  contexts: [],
  currentContext: null,
  contextActions: {
    getAll: async () => {
      const contexts = await db.contexts.toArray();
      set({ contexts });
    },

    add: async (contextData) => {
      const context: Context = {
        ...contextData,
        id: uuidv4(),
      };
      await db.contexts.add(context);
      set((state) => ({ contexts: [...state.contexts, context] }));
      return context;
    },

    update: async (id, updates) => {
      await db.contexts.update(id, updates);
      set((state) => ({
        contexts: state.contexts.map((c) =>
          c.id === id ? { ...c, ...updates } : c
        ),
      }));
    },

    delete: async (id) => {
      // Data integrity: remove contextId from all tasks referencing it
      await db.transaction('rw', [db.contexts, db.tasks], async () => {
        await db.contexts.delete(id);
        const tasks = await db.tasks.toArray();
        for (const task of tasks) {
          if (task.contextIds.includes(id)) {
            const newContextIds = task.contextIds.filter(contextId => contextId !== id);
            await db.tasks.update(task.id, { contextIds: newContextIds, updatedAt: new Date() });
          }
        }
      });

      // Update local state
      const contexts = await db.contexts.toArray();
      set({
        contexts,
        currentContext: get().currentContext === id ? null : get().currentContext
      });

      // Trigger a task refresh to update local task state
      await get().taskActions.getAll();
    },

    setCurrentContext: (contextId) => {
      set({ currentContext: contextId });
    },
  },
});
