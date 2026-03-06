import { useState, useEffect, useCallback } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Calendar, Clock } from 'lucide-react';
import { useTaskStore } from '../store/useTaskStore';
import type { Task } from '../types';

interface TaskFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editTask?: Task | null;
}

export function TaskForm({ open, onOpenChange, editTask }: TaskFormProps) {
  const { projects, tags, contexts, tasks, taskActions } = useTaskStore();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedContexts, setSelectedContexts] = useState<string[]>([]);
  const [deadline, setDeadline] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState<number | ''>('');
  const [dependsOnTaskId, setDependsOnTaskId] = useState<string>('');

  const incompleteTasks = tasks.filter(t => t.status !== 'done' && t.id !== editTask?.id);

  const resetForm = useCallback(() => {
    setTitle('');
    setDescription('');
    setProjectId('');
    setSelectedTags([]);
    setSelectedContexts([]);
    setDeadline('');
    setEstimatedMinutes('');
    setDependsOnTaskId('');
  }, []);

  useEffect(() => {
    if (editTask && open) {
      setTitle(editTask.title);
      setDescription(editTask.description || '');
      setProjectId(editTask.projectId || '');
      setSelectedTags(editTask.tagIds);
      setSelectedContexts(editTask.contextIds);
      setDeadline(editTask.deadline ? editTask.deadline.toISOString().split('T')[0] : '');
      setEstimatedMinutes(editTask.estimatedMinutes || '');
      setDependsOnTaskId(editTask.dependsOnTaskId || '');
    } else if (!editTask && open) {
      resetForm();
    }
  }, [editTask, open, resetForm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const taskData = {
      title: title.trim(),
      description: description.trim() || undefined,
      projectId: projectId || undefined,
      tagIds: selectedTags,
      contextIds: selectedContexts,
      deadline: deadline ? new Date(deadline) : undefined,
      estimatedMinutes: estimatedMinutes ? Number(estimatedMinutes) : undefined,
      dependsOnTaskId: dependsOnTaskId || undefined,
      status: editTask?.status || 'inbox' as const,
      completedAt: editTask?.completedAt,
    };

    if (editTask) {
      await taskActions.update(editTask.id, taskData);
    } else {
      await taskActions.add(taskData);
    }

    resetForm();
    onOpenChange(false);
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const toggleContext = (contextId: string) => {
    setSelectedContexts(prev => 
      prev.includes(contextId) 
        ? prev.filter(id => id !== contextId)
        : [...prev, contextId]
    );
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-xl shadow-xl z-50 p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="text-xl font-semibold text-slate-800">
              {editTask ? 'Edit Task' : 'Add Task'}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button type="button" className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="task-title" className="block text-sm font-medium text-slate-700 mb-1">
                Title *
              </label>
              <input
                id="task-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What needs to be done?"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="task-description" className="block text-sm font-medium text-slate-700 mb-1">
                Description
              </label>
              <textarea
                id="task-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add details..."
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            <div>
              <label htmlFor="task-project" className="block text-sm font-medium text-slate-700 mb-1">
                Project
              </label>
              <select
                id="task-project"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">No project</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <span className="block text-sm font-medium text-slate-700 mb-2">Tags</span>
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    className={`
                      px-3 py-1 rounded-full text-sm font-medium transition-colors
                      ${selectedTags.includes(tag.id) 
                        ? 'text-white' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}
                    `}
                    style={selectedTags.includes(tag.id) ? { backgroundColor: tag.color } : {}}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="block text-sm font-medium text-slate-700 mb-2">Contexts</span>
              <div className="flex flex-wrap gap-2">
                {contexts.map(context => (
                  <button
                    key={context.id}
                    type="button"
                    onClick={() => toggleContext(context.id)}
                    className={`
                      px-3 py-1 rounded-full text-sm font-medium transition-colors
                      ${selectedContexts.includes(context.id) 
                        ? 'bg-slate-700 text-white' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}
                    `}
                  >
                    @{context.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="task-deadline" className="block text-sm font-medium text-slate-700 mb-1">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Deadline
                </label>
                <input
                  id="task-deadline"
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="task-estimate" className="block text-sm font-medium text-slate-700 mb-1">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Est. Time (min)
                </label>
                <input
                  id="task-estimate"
                  type="number"
                  value={estimatedMinutes}
                  onChange={(e) => setEstimatedMinutes(e.target.value ? Number(e.target.value) : '')}
                  placeholder="30"
                  min="1"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="task-blocks" className="block text-sm font-medium text-slate-700 mb-1">
                Blocks
              </label>
              <select
                id="task-blocks"
                value={dependsOnTaskId}
                onChange={(e) => setDependsOnTaskId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Not blocked by any task</option>
                {incompleteTasks.map(task => (
                  <option key={task.id} value={task.id}>
                    {task.title}
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-500 mt-1">
                This task depends on another task being completed first
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Dialog.Close asChild>
                <button 
                  type="button"
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
              </Dialog.Close>
              <button 
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {editTask ? 'Save Changes' : 'Add Task'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
