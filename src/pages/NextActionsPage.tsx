import { useMemo, useState } from 'react';
import { useTaskStore } from '../store/useTaskStore';
import { TaskItem } from '../components/TaskItem';
import { TaskModal } from '../components/TaskModal';
import type { Task } from '../types';
import { differenceInDays, isPast, isToday } from 'date-fns';
import { Zap, ArrowDownToLine, Calendar } from 'lucide-react';

function calculateScore(task: Task, currentContext: string | null): number {
  let score = 0;

  if (currentContext && task.contextIds.includes(currentContext)) {
    score += 40;
  }

  if (task.deadline) {
    const deadline = new Date(task.deadline);
    const daysUntil = differenceInDays(deadline, new Date());
    
    if (isPast(deadline) && !isToday(deadline)) {
      score += 40;
    } else if (daysUntil <= 1) {
      score += 40;
    } else if (daysUntil <= 3) {
      score += 30;
    } else if (daysUntil <= 7) {
      score += 20;
    } else if (daysUntil <= 14) {
      score += 10;
    }
  }

  if (task.projectId) {
    score += 20;
  }

  return score;
}

export function NextActionsPage() {
  const { tasks, currentContext, taskActions } = useTaskStore();
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  const scoredTasks = useMemo(() => {
    const eligibleTasks = tasks.filter(task => {
      if (task.status === 'done') return false;
      if (task.dependsOnTaskId) {
        const dependency = tasks.find(t => t.id === task.dependsOnTaskId);
        if (dependency && dependency.status !== 'done') return false;
      }
      return true;
    });

    return eligibleTasks
      .map(task => ({
        ...task,
        score: calculateScore(task, currentContext),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 7);
  }, [tasks, currentContext]);

  const handleDoIt = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task?.dependsOnTaskId) {
      const blocking = tasks.find(t => t.id === task.dependsOnTaskId);
      if (blocking && blocking.status !== 'done') {
        setWarning(`This task is blocked by "${blocking.title}". Complete that first.`);
        return;
      }
    }
    await taskActions.update(taskId, { 
      status: 'done', 
      completedAt: new Date() 
    });
  };

  const handleMoveToInbox = async (taskId: string) => {
    await taskActions.update(taskId, { status: 'inbox' });
  };

  const handleMoveToCalendar = async (taskId: string) => {
    await taskActions.update(taskId, { status: 'calendared' });
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-800">Next Actions</h1>
        <p className="text-sm text-slate-500 mt-1">
          Top {scoredTasks.length} tasks based on context, deadline, and project
        </p>
      </div>

      {currentContext && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700">
            <strong>@{currentContext}</strong>
           Filtering by context:</p>
        </div>
      )}

      {warning && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-700">{warning}</p>
          <button 
            type="button"
            onClick={() => setWarning(null)}
            className="text-xs text-amber-600 underline mt-1"
          >
            Dismiss
          </button>
        </div>
      )}

      {scoredTasks.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Zap className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-700">No tasks to show</h3>
          <p className="text-sm text-slate-500 mt-1">
            Add tasks to your inbox or mark some as Next Actions
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {scoredTasks.map(task => (
            <div key={task.id} className="relative">
              <div className="absolute -left-12 top-4 flex flex-col items-center">
                <span className={`
                  text-lg font-bold
                  ${task.score >= 80 ? 'text-green-600' : 
                    task.score >= 60 ? 'text-blue-600' : 
                    task.score >= 40 ? 'text-yellow-600' : 'text-slate-400'}
                `}>
                  {task.score}
                </span>
              </div>
              <TaskItem task={task} onEdit={handleEdit} />
              <div className="flex gap-2 mt-2 ml-4">
                <button
                  type="button"
                  onClick={() => handleDoIt(task.id)}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <Zap className="w-4 h-4" />
                  Do it
                </button>
                <button
                  type="button"
                  onClick={() => handleMoveToInbox(task.id)}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200"
                >
                  <ArrowDownToLine className="w-4 h-4" />
                  Inbox
                </button>
                <button
                  type="button"
                  onClick={() => handleMoveToCalendar(task.id)}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200"
                >
                  <Calendar className="w-4 h-4" />
                  Calendar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <TaskModal 
        open={!!editingTask} 
        onOpenChange={(open) => !open && setEditingTask(null)}
        editTask={editingTask}
      />
    </div>
  );
}
