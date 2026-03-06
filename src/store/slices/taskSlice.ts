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

/**
 * Ensures completedAt is correctly set or cleared based on task status.
 */
function prepareTaskUpdates(updates: Partial<Task>): Partial<Task> {
  const result = { ...updates, updatedAt: new Date() };

  if (updates.status === 'done') {
    if (!updates.completedAt) {
      result.completedAt = new Date();
    }
  } else if (updates.status && updates.status !== 'done') {
    result.completedAt = undefined;
  }

  return result;
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

      // Ensure completedAt consistency for new tasks
      if (task.status === 'done' && !task.completedAt) {
        task.completedAt = now;
      } else if (task.status !== 'done') {
        task.completedAt = undefined;
      }

      await db.tasks.add(task);
      set((state) => ({ tasks: [...state.tasks, task] }));
      return task;
    },

    update: async (id, updates) => {
      const updatedData = prepareTaskUpdates(updates);

      await db.tasks.update(id, updatedData);

      // Update local state by fetching latest tasks to ensure consistency
      const tasks = await db.tasks.toArray();
      set({ tasks });
    },

    delete: async (id) => {
      // Data integrity: tasks that depend on this task should have their dependsOnTaskId cleared
      await db.transaction('rw', [db.tasks], async () => {
        await db.tasks.delete(id);

        // Use modify for more efficient cleanup
        await db.tasks
          .where('dependsOnTaskId')
          .equals(id)
          .modify({
            dependsOnTaskId: undefined,
            updatedAt: new Date()
          });
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
