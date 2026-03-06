import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { db, initializeDatabase } from '../db';
import type { Task, Project, Tag, Context, TaskStatus } from '../types';

interface TaskStore {
  tasks: Task[];
  projects: Project[];
  tags: Tag[];
  contexts: Context[];
  currentContext: string | null;
  isLoading: boolean;
  initialized: boolean;
  
  initialize: () => Promise<void>;
  
  taskActions: {
    getAll: () => Promise<void>;
    add: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Task>;
    update: (id: string, updates: Partial<Task>) => Promise<void>;
    delete: (id: string) => Promise<void>;
    getById: (id: string) => Task | undefined;
    getByStatus: (status: TaskStatus) => Task[];
  };
  
  projectActions: {
    getAll: () => Promise<void>;
    add: (project: Omit<Project, 'id'>) => Promise<Project>;
    update: (id: string, updates: Partial<Project>) => Promise<void>;
    delete: (id: string) => Promise<void>;
  };
  
  tagActions: {
    getAll: () => Promise<void>;
    add: (tag: Omit<Tag, 'id'>) => Promise<Tag>;
    update: (id: string, updates: Partial<Tag>) => Promise<void>;
    delete: (id: string) => Promise<void>;
  };
  
  contextActions: {
    getAll: () => Promise<void>;
    add: (context: Omit<Context, 'id'>) => Promise<Context>;
    update: (id: string, updates: Partial<Context>) => Promise<void>;
    delete: (id: string) => Promise<void>;
    setCurrentContext: (contextId: string | null) => void;
  };
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  projects: [],
  tags: [],
  contexts: [],
  currentContext: null,
  isLoading: false,
  initialized: false,

  initialize: async () => {
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

  taskActions: {
    getAll: async () => {
      const tasks = await db.tasks.toArray();
      set({ tasks });
    },

    add: async (taskData) => {
      const now = new Date();
      const task: Task = {
        ...taskData,
        id: uuidv4(),
        createdAt: now,
        updatedAt: now,
      };
      await db.tasks.add(task);
      set((state) => ({ tasks: [...state.tasks, task] }));
      return task;
    },

    update: async (id, updates) => {
      const updatedData = { ...updates, updatedAt: new Date() };
      await db.tasks.update(id, updatedData);
      set((state) => ({
        tasks: state.tasks.map((t) => 
          t.id === id ? { ...t, ...updatedData } : t
        ),
      }));
    },

    delete: async (id) => {
      await db.tasks.delete(id);
      set((state) => ({
        tasks: state.tasks.filter((t) => t.id !== id),
      }));
    },

    getById: (id) => {
      return get().tasks.find((t) => t.id === id);
    },

    getByStatus: (status) => {
      return get().tasks.filter((t) => t.status === status);
    },
  },

  projectActions: {
    getAll: async () => {
      const projects = await db.projects.toArray();
      set({ projects });
    },

    add: async (projectData) => {
      const project: Project = {
        ...projectData,
        id: uuidv4(),
      };
      await db.projects.add(project);
      set((state) => ({ projects: [...state.projects, project] }));
      return project;
    },

    update: async (id, updates) => {
      await db.projects.update(id, updates);
      set((state) => ({
        projects: state.projects.map((p) => 
          p.id === id ? { ...p, ...updates } : p
        ),
      }));
    },

    delete: async (id) => {
      await db.projects.delete(id);
      set((state) => ({
        projects: state.projects.filter((p) => p.id !== id),
      }));
    },
  },

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
      await db.tags.delete(id);
      set((state) => ({
        tags: state.tags.filter((t) => t.id !== id),
      }));
    },
  },

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
      await db.contexts.delete(id);
      set((state) => ({
        contexts: state.contexts.filter((c) => c.id !== id),
      }));
    },

    setCurrentContext: (contextId) => {
      set({ currentContext: contextId });
    },
  },
}));
