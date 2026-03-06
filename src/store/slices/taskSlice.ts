import { v4 as uuidv4 } from 'uuid';
import { db } from '../../db';
import type { Task, TaskStatus } from '../../types';
import type { StateCreator } from 'zustand';

export interface TaskSlice {
  tasks: Task[];
  taskActions: {
    getAll: () => Promise<void>;
    add: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Task>;
    update: (id: string, updates: Partial<Task>) => Promise<void>;
    delete: (id: string) => Promise<void>;
    getById: (id: string) => Task | undefined;
    getByStatus: (status: TaskStatus) => Task[];
  };
}

export const createTaskSlice: StateCreator<TaskSlice, [], [], TaskSlice> = (set, get) => ({
  tasks: [],
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
      // Data integrity: tasks that depend on this task should have their dependsOnTaskId cleared
      await db.transaction('rw', [db.tasks], async () => {
        await db.tasks.delete(id);
        const dependentTasks = await db.tasks
          .toCollection()
          .filter((task) => task.dependsOnTaskId === id)
          .toArray();
        for (const task of dependentTasks) {
          await db.tasks.update(task.id, {
            dependsOnTaskId: undefined,
            updatedAt: new Date(),
          });
        }
      });

      // Update local state
      const tasks = await db.tasks.toArray();
      set({ tasks });
    },

    getById: (id) => {
      return get().tasks.find((t) => t.id === id);
    },

    getByStatus: (status) => {
      return get().tasks.filter((t) => t.status === status);
    },
  },
});
