import { useState, useEffect, useCallback } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Calendar, Clock, ChevronDown, Plus } from 'lucide-react';
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
    if (open) {
      if (editTask) {
        setTitle(editTask.title);
        setDescription(editTask.description || '');
        setProjectId(editTask.projectId || '');
        setSelectedTags(editTask.tagIds);
        setSelectedContexts(editTask.contextIds);
        setDeadline(editTask.deadline ? new Date(editTask.deadline).toISOString().split('T')[0] : '');
        setEstimatedMinutes(editTask.estimatedMinutes || '');
        setDependsOnTaskId(editTask.dependsOnTaskId || '');
      } else {
        resetForm();
      }
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
        <Dialog.Overlay className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 animate-in fade-in duration-300" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xl bg-white rounded-3xl shadow-2xl z-50 p-0 overflow-hidden animate-in fade-in zoom-in duration-300">
          <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <Dialog.Title className="text-xl font-bold text-slate-900">
                {editTask ? 'Edit Task' : 'New Task'}
              </Dialog.Title>
              <Dialog.Description className="text-sm text-slate-500 mt-1">
                {editTask ? 'Update task details and assignments.' : 'Capture your thoughts and organize them later.'}
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button type="button" className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all">
                <X className="w-5 h-5" />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col max-h-[85vh]">
            <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar">
              <div className="space-y-2">
                <label htmlFor="task-title" className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">
                  Task Title
                </label>
                <input
                  id="task-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Prepare quarterly review slides"
                  className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="task-description" className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">
                  Description
                </label>
                <textarea
                  id="task-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add more context or sub-tasks..."
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 transition-all outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="task-project" className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">
                    Project
                  </label>
                  <div className="relative">
                    <select
                      id="task-project"
                      value={projectId}
                      onChange={(e) => setProjectId(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-slate-900 appearance-none focus:ring-2 focus:ring-blue-500 transition-all outline-none cursor-pointer"
                    >
                      <option value="">No Project</option>
                      {projects.map(project => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="task-deadline" className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">
                    Deadline
                  </label>
                  <div className="relative">
                    <input
                      id="task-deadline"
                      type="date"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-slate-900 focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                    />
                    <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Tags</span>
                <div className="flex flex-wrap gap-2">
                  {tags.map(tag => {
                    const isSelected = selectedTags.includes(tag.id);
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => toggleTag(tag.id)}
                        className={`
                          px-4 py-1.5 rounded-full text-xs font-bold transition-all border-2
                          ${isSelected
                            ? 'border-transparent text-white'
                            : 'bg-white border-slate-100 text-slate-500 hover:border-slate-200'}
                        `}
                        style={isSelected ? { backgroundColor: tag.color } : {}}
                      >
                        {isSelected && <Plus className="w-3 h-3 inline mr-1 rotate-45" />}
                        {tag.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Contexts</span>
                <div className="flex flex-wrap gap-2">
                  {contexts.map(context => {
                    const isSelected = selectedContexts.includes(context.id);
                    return (
                      <button
                        key={context.id}
                        type="button"
                        onClick={() => toggleContext(context.id)}
                        className={`
                          px-4 py-1.5 rounded-full text-xs font-bold transition-all border-2
                          ${isSelected
                            ? 'bg-slate-900 border-slate-900 text-white'
                            : 'bg-white border-slate-100 text-slate-500 hover:border-slate-200'}
                        `}
                      >
                        @{context.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                <div className="space-y-2">
                  <label htmlFor="task-estimate" className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Time Estimate (min)
                  </label>
                  <input
                    id="task-estimate"
                    type="number"
                    value={estimatedMinutes}
                    onChange={(e) => setEstimatedMinutes(e.target.value ? Number(e.target.value) : '')}
                    placeholder="e.g., 30"
                    min="1"
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-slate-900 focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="task-blocks" className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">
                    Blocked By
                  </label>
                  <div className="relative">
                    <select
                      id="task-blocks"
                      value={dependsOnTaskId}
                      onChange={(e) => setDependsOnTaskId(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-slate-900 appearance-none focus:ring-2 focus:ring-blue-500 transition-all outline-none cursor-pointer"
                    >
                      <option value="">No Dependency</option>
                      {incompleteTasks.map(task => (
                        <option key={task.id} value={task.id}>
                          {task.title}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8 bg-slate-50 flex flex-col sm:flex-row justify-end gap-3 border-t border-slate-100 mt-auto">
              <Dialog.Close asChild>
                <button 
                  type="button"
                  className="px-6 py-3 text-slate-500 font-bold text-sm hover:bg-slate-200/50 rounded-2xl transition-all"
                >
                  Cancel
                </button>
              </Dialog.Close>
              <button 
                type="submit"
                className="px-8 py-3 bg-blue-600 text-white font-bold text-sm rounded-2xl hover:bg-blue-700 shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
              >
                {editTask ? 'Update Task' : 'Create Task'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
