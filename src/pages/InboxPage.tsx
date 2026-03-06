import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useTaskStore } from '../store/useTaskStore';
import { TaskForm } from '../components/TaskForm';
import { TaskList } from '../components/TaskList';
import type { Task } from '../types';

export function InboxPage() {
  const { tasks } = useTaskStore();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const inboxTasks = tasks.filter(t => t.status === 'inbox');

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingTask(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Inbox</h1>
          <p className="text-sm text-slate-500 mt-1">
            {inboxTasks.length} {inboxTasks.length === 1 ? 'task' : 'tasks'}
          </p>
        </div>
        
        <button
          type="button"
          onClick={() => setIsFormOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Task
        </button>
      </div>

      <TaskList tasks={inboxTasks} onEdit={handleEdit} />

      <TaskForm 
        open={isFormOpen} 
        onOpenChange={handleFormClose}
        editTask={editingTask}
      />
    </div>
  );
}
