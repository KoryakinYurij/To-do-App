import { Inbox, Plus } from 'lucide-react';
import { TaskItem } from './TaskItem';
import type { Task } from '../types';

interface TaskListProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onAddTask?: () => void;
}

export function TaskList({ tasks, onEdit, onAddTask }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-white/50 border-2 border-dashed border-slate-200 rounded-3xl">
        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-5 text-blue-500">
          <Inbox className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-800">Clear as day</h3>
        <p className="text-slate-500 mt-2 max-w-xs">
          Your list is empty. Enjoy the peace of mind or start by adding a new task.
        </p>
        {onAddTask && (
          <button
            onClick={onAddTask}
            className="mt-6 flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-95"
          >
            <Plus className="w-5 h-5" />
            Create First Task
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {tasks.map(task => (
        <TaskItem 
          key={task.id} 
          task={task} 
          onEdit={onEdit}
        />
      ))}
    </div>
  );
}
