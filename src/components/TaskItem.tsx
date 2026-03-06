import { Pencil, Trash2, Calendar, Clock, ChevronDown, Lock } from 'lucide-react';
import { useState } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useTaskStore } from '../store/useTaskStore';
import type { Task, TaskStatus } from '../types';
import { format } from 'date-fns';

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
    <div className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-slate-800 truncate flex items-center gap-2">
            {task.title}
            {isBlocked && (
              <Lock className="w-4 h-4 text-slate-400" />
            )}
          </h3>
          
          {isBlocked && (
            <p className="text-sm text-amber-600 mt-1">
              Waiting for: {blockingTask?.title}
            </p>
          )}
          
          {task.description && (
            <p className="text-sm text-slate-500 mt-1 line-clamp-2">{task.description}</p>
          )}

          <div className="flex flex-wrap items-center gap-2 mt-3">
            {project && (
              <span 
                className="px-2 py-0.5 rounded text-xs font-medium text-white"
                style={{ backgroundColor: project.color }}
              >
                {project.name}
              </span>
            )}

            {taskTags.map(tag => (
              <span
                key={tag.id}
                className="px-2 py-0.5 rounded text-xs font-medium text-white"
                style={{ backgroundColor: tag.color }}
              >
                {tag.name}
              </span>
            ))}

            {taskContexts.map(context => (
              <span
                key={context.id}
                className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600"
              >
                @{context.name}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
            {task.deadline && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {format(new Date(task.deadline), 'MMM d')}
              </span>
            )}
            {task.estimatedMinutes && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {task.estimatedMinutes} min
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button 
                type="button"
                className="p-2 hover:bg-slate-100 rounded-lg text-slate-500"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
              <DropdownMenu.Content 
                className="min-w-[160px] bg-white rounded-lg shadow-lg border border-slate-200 p-1 z-50"
                sideOffset={5}
              >
                {nextStatus && (
                  <DropdownMenu.Item
                    className="px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded cursor-pointer outline-none"
                    onClick={() => handleStatusChange(nextStatus)}
                  >
                    Move to {statusLabels[nextStatus]}
                  </DropdownMenu.Item>
                )}
                
                <DropdownMenu.Item
                  className="px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded cursor-pointer outline-none"
                  onClick={() => onEdit(task)}
                >
                  <Pencil className="w-3 h-3 inline mr-2" />
                  Edit
                </DropdownMenu.Item>
                
                <DropdownMenu.Separator className="h-px bg-slate-200 my-1" />
                
                <DropdownMenu.Item
                  className={`px-3 py-2 text-sm rounded cursor-pointer outline-none ${
                    isDeleting ? 'bg-red-100 text-red-600' : 'text-red-600 hover:bg-red-50'
                  }`}
                  onClick={handleDelete}
                >
                  <Trash2 className="w-3 h-3 inline mr-2" />
                  {isDeleting ? 'Click again to confirm' : 'Delete'}
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      </div>
    </div>
  );
}
