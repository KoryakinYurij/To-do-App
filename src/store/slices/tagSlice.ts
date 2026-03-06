import { v4 as uuidv4 } from 'uuid';
import { db } from '../../db';
import type { Tag } from '../../types';
import type { StateCreator } from 'zustand';

export interface TagSlice {
  tags: Tag[];
  tagActions: {
    getAll: () => Promise<void>;
    add: (tag: Omit<Tag, 'id'>) => Promise<Tag>;
    update: (id: string, updates: Partial<Tag>) => Promise<void>;
    delete: (id: string) => Promise<void>;
  };
}

export const createTagSlice: StateCreator<TagSlice & { taskActions: { getAll: () => Promise<void> } }, [], [], TagSlice> = (set, get) => ({
  tags: [],
  tagActions: {
    getAll: async () => {
      const tags = await db.tags.toArray();
      set({ tags });
    },

    add: async (tagData) => {
      const tag: Tag = {
        ...tagData,
        id: uuidv4(),
      };
      await db.tags.add(tag);
      set((state) => ({ tags: [...state.tags, tag] }));
      return tag;
    },

    update: async (id, updates) => {
      await db.tags.update(id, updates);
      set((state) => ({
        tags: state.tags.map((t) =>
          t.id === id ? { ...t, ...updates } : t
        ),
      }));
    },

    delete: async (id) => {
      // Data integrity: remove tagId from all tasks referencing it
      await db.transaction('rw', [db.tags, db.tasks], async () => {
        await db.tags.delete(id);
        const tasks = await db.tasks.toArray();
        for (const task of tasks) {
          if (task.tagIds.includes(id)) {
            const newTagIds = task.tagIds.filter(tagId => tagId !== id);
            await db.tasks.update(task.id, { tagIds: newTagIds, updatedAt: new Date() });
          }
        }
      });

      // Update local state
      const tags = await db.tags.toArray();
      set({ tags });

      // Trigger a task refresh to update local task state
      await get().taskActions.getAll();
    },
  },
});
