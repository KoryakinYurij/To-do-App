export type TaskStatus = 'inbox' | 'next' | 'calendared' | 'done';

export interface Task {
  id: string;
  title: string;
  description?: string;
  projectId?: string;
  tagIds: string[];
  contextIds: string[];
  deadline?: Date;
  estimatedMinutes?: number;
  dependsOnTaskId?: string;
  status: TaskStatus;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface Project {
  id: string;
  name: string;
  color: string;
  archived?: boolean;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface Context {
  id: string;
  name: string;
  icon?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end?: Date;
  taskId?: string;
  allDay?: boolean;
}
