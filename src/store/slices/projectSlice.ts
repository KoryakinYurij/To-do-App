import { v4 as uuidv4 } from 'uuid';
import { db } from '../../db';
import type { Project } from '../../types';
import type { StateCreator } from 'zustand';

export interface ProjectSlice {
  projects: Project[];
  projectActions: {
    getAll: () => Promise<void>;
    add: (project: Omit<Project, 'id'>) => Promise<Project>;
    update: (id: string, updates: Partial<Project>) => Promise<void>;
    delete: (id: string) => Promise<void>;
  };
}

export const createProjectSlice: StateCreator<ProjectSlice & { taskActions: { getAll: () => Promise<void> } }, [], [], ProjectSlice> = (set, get) => ({
  projects: [],
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
      // Data integrity: clear projectId for all tasks referencing this project
      await db.transaction('rw', [db.projects, db.tasks], async () => {
        await db.projects.delete(id);

        await db.tasks
          .where('projectId')
          .equals(id)
          .modify({
            projectId: undefined,
            updatedAt: new Date()
          });
      });

      // Update local state
      const projects = await db.projects.toArray();
      set({ projects });

      // Trigger a task refresh to update local task state
      await get().taskActions.getAll();
    },
  },
});
