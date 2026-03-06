import Dexie, { type Table } from 'dexie';
import { v4 as uuidv4 } from 'uuid';
import type { Task, Project, Tag, Context } from '../types';

export class AppDatabase extends Dexie {
  tasks!: Table<Task, string>;
  projects!: Table<Project, string>;
  tags!: Table<Tag, string>;
  contexts!: Table<Context, string>;

  constructor() {
    super('AttentionFlowDB');
    this.version(1).stores({
      tasks: 'id, status, projectId, createdAt, deadline',
      projects: 'id, name, archived',
      tags: 'id, name',
      contexts: 'id, name',
    });

    // Add dependsOnTaskId to index for better query performance during deletion cleanup
    this.version(2).stores({
      tasks: 'id, status, projectId, createdAt, deadline, dependsOnTaskId',
    });
  }
}

export const db = new AppDatabase();

const DEFAULT_PROJECTS: Project[] = [
  { id: uuidv4(), name: 'Work', color: '#3b82f6' },
  { id: uuidv4(), name: 'Personal', color: '#10b981' },
  { id: uuidv4(), name: 'Health', color: '#ef4444' },
  { id: uuidv4(), name: 'Learning', color: '#8b5cf6' },
];

const DEFAULT_CONTEXTS: Context[] = [
  { id: uuidv4(), name: 'home', icon: 'Home' },
  { id: uuidv4(), name: 'office', icon: 'Building' },
  { id: uuidv4(), name: 'online', icon: 'Globe' },
  { id: uuidv4(), name: 'offline', icon: 'WifiOff' },
  { id: uuidv4(), name: 'call', icon: 'Phone' },
  { id: uuidv4(), name: 'laptop', icon: 'Laptop' },
];

const DEFAULT_TAGS: Tag[] = [
  { id: uuidv4(), name: 'Urgent', color: '#ef4444' },
  { id: uuidv4(), name: 'Important', color: '#f59e0b' },
  { id: uuidv4(), name: 'Later', color: '#6b7280' },
];

export async function seedDatabase(): Promise<void> {
  const projectCount = await db.projects.count();
  if (projectCount > 0) return;

  await db.transaction('rw', [db.projects, db.contexts, db.tags], async () => {
    await db.projects.bulkAdd(DEFAULT_PROJECTS);
    await db.contexts.bulkAdd(DEFAULT_CONTEXTS);
    await db.tags.bulkAdd(DEFAULT_TAGS);
  });
}

export async function initializeDatabase(): Promise<void> {
  await seedDatabase();
}
