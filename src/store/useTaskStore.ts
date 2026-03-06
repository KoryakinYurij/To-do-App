import { create } from 'zustand';
import { db, initializeDatabase } from '../db';
import { createTaskSlice, type TaskSlice } from './slices/taskSlice';
import { createProjectSlice, type ProjectSlice } from './slices/projectSlice';
import { createTagSlice, type TagSlice } from './slices/tagSlice';
import { createContextSlice, type ContextSlice } from './slices/contextSlice';

interface RootStore extends TaskSlice, ProjectSlice, TagSlice, ContextSlice {
  isLoading: boolean;
  initialized: boolean;
  initialize: () => Promise<void>;
}

export const useTaskStore = create<RootStore>()((...a) => ({
  ...createTaskSlice(...a),
  ...createProjectSlice(...a),
  ...createTagSlice(...a),
  ...createContextSlice(...a),

  isLoading: false,
  initialized: false,

  initialize: async () => {
    const [set, get] = a;
    if (get().initialized) return;
    
    set({ isLoading: true });
    await initializeDatabase();
    
    const [tasks, projects, tags, contexts] = await Promise.all([
      db.tasks.toArray(),
      db.projects.toArray(),
      db.tags.toArray(),
      db.contexts.toArray(),
    ]);
    
    set({ 
      tasks, 
      projects, 
      tags, 
      contexts,
      isLoading: false,
      initialized: true 
    });
  },
}));
