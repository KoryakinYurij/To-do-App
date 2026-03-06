import { Pencil, Trash2, Calendar, Clock, ChevronDown, Lock, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useTaskStore } from '../store/useTaskStore';
import type { Task, TaskStatus } from '../types';
import { format } from 'date-fns';
import { cn } from '../utils/cn';

interface TaskItemProps {
  task: Task;
  onEdit: (task: Task) => void;
}

const statusLabels: Record<TaskStatus, string> = {
  inbox: 'Inbox',
  next: 'Next Action',
  calendared: 'Calendared',
  done: 'Done',
};

const statusOrder: TaskStatus[] = ['inbox', 'next', 'calendared', 'done'];

export function TaskItem({ task, onEdit }: TaskItemProps) {
  const { projects, tags, contexts, tasks, taskActions } = useTaskStore();
  const [isDeleting, setIsDeleting] = useState(false);

  const project = projects.find(p => p.id === task.projectId);
  const taskTags = tags.filter(t => task.tagIds.includes(t.id));
  const taskContexts = contexts.filter(c => task.contextIds.includes(c.id));
  
  const blockingTask = task.dependsOnTaskId 
    ? tasks.find(t => t.id === task.dependsOnTaskId) 
    : null;
  const isBlocked = blockingTask && blockingTask.status !== 'done';

  const getNextStatus = (current: TaskStatus): TaskStatus | null => {
    const currentIndex = statusOrder.indexOf(current);
    if (currentIndex < statusOrder.length - 1) {
      return statusOrder[currentIndex + 1];
    }
    return null;
  };

  const handleStatusChange = async (newStatus: TaskStatus) => {
    if (newStatus === 'done') {
      await taskActions.update(task.id, { 
        status: newStatus, 
        completedAt: new Date() 
      });
    } else {
      await taskActions.update(task.id, { status: newStatus });
    }
  };

  const toggleDone = async () => {
    const newStatus: TaskStatus = task.status === 'done' ? 'inbox' : 'done';
    await handleStatusChange(newStatus);
  };

  const handleDelete = async () => {
    if (isDeleting) {
      await taskActions.delete(task.id);
    } else {
      setIsDeleting(true);
      setTimeout(() => setIsDeleting(false), 3000);
    }
  };

  const nextStatus = getNextStatus(task.status);

  return (
    <div className="group bg-white border border-slate-200 rounded-2xl p-4 hover:border-blue-200 hover:shadow-sm transition-all">
      <div className="flex items-start gap-4">
        <button
          onClick={toggleDone}
          className={`
            mt-1 flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all
            ${task.status === 'done'
              ? 'bg-green-500 border-green-500 text-white'
              : 'border-slate-300 text-transparent hover:border-blue-500 hover:text-blue-500/30'}
          `}
        >
          <CheckCircle2 className="w-4 h-4" />
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3">
            <h3 className={`
              text-base font-semibold text-slate-800 transition-all
              ${task.status === 'done' ? 'line-through text-slate-400' : ''}
            `}>
              {task.title}
              {isBlocked && (
                <Lock className="inline ml-2 w-4 h-4 text-amber-500" />
              )}
            </h3>

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <button
                    type="button"
                    className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </DropdownMenu.Trigger>

                <DropdownMenu.Portal>
                  <DropdownMenu.Content
                    className="min-w-[180px] bg-white rounded-xl shadow-xl border border-slate-100 p-1.5 z-50 animate-in fade-in zoom-in duration-200"
                    sideOffset={5}
                    align="end"
                  >
                    {nextStatus && (
                      <DropdownMenu.Item
                        className="px-3 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg cursor-pointer outline-none transition-colors"
                        onClick={() => handleStatusChange(nextStatus)}
                      >
                        Move to {statusLabels[nextStatus]}
                      </DropdownMenu.Item>
                    )}

                    <DropdownMenu.Item
                      className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg cursor-pointer outline-none transition-colors"
                      onClick={() => onEdit(task)}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Edit Details
                    </DropdownMenu.Item>

                    <DropdownMenu.Separator className="h-px bg-slate-100 my-1.5" />

                    <DropdownMenu.Item
                      className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg cursor-pointer outline-none transition-colors ${
                        isDeleting ? 'bg-red-50 text-red-600' : 'text-red-500 hover:bg-red-50'
                      }`}
                      onClick={handleDelete}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      {isDeleting ? 'Confirm Delete' : 'Delete Task'}
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
            </div>
          </div>
          
          {isBlocked && (
            <p className="text-xs font-medium text-amber-600 mt-1 flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-amber-600" />
              Waiting for: {blockingTask?.title}
            </p>
          )}
          
          {task.description && (
            <p className="text-sm text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
              {task.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2 mt-3.5">
            {project && (
              <span 
                className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                style={{ backgroundColor: `${project.color}20`, color: project.color }}
              >
                {project.name}
              </span>
            )}

            {taskTags.map(tag => (
              <span
                key={tag.id}
                className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
              >
                {tag.name}
              </span>
            ))}

            {taskContexts.map(context => (
              <span
                key={context.id}
                className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 uppercase tracking-wider"
              >
                @{context.name}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-4 mt-3 text-[11px] font-medium text-slate-400">
            {task.deadline && (
              <span className={cn(
                "flex items-center gap-1.5",
                new Date(task.deadline) < new Date() && task.status !== 'done' ? "text-rose-500" : ""
              )}>
                <Calendar className="w-3.5 h-3.5" />
                {format(new Date(task.deadline), 'MMM d, yyyy')}
              </span>
            )}
            {task.estimatedMinutes && (
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {task.estimatedMinutes} min
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
