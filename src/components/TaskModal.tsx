import { TaskForm } from './TaskForm';
import type { Task } from '../types';

interface TaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editTask: Task | null;
}

export function TaskModal({ open, onOpenChange, editTask }: TaskModalProps) {
  return (
    <TaskForm 
      open={open} 
      onOpenChange={onOpenChange} 
      editTask={editTask}
    />
  );
}
