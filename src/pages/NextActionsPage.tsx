import { useMemo, useState } from 'react';
import { useTaskStore } from '../store/useTaskStore';
import { TaskItem } from '../components/TaskItem';
import { TaskModal } from '../components/TaskModal';
import type { Task } from '../types';
import { differenceInDays, isPast, isToday } from 'date-fns';
import { Zap, ArrowDownToLine, Calendar, AlertCircle } from 'lucide-react';
import { ensureDate } from '../utils/dateUtils';

function calculateScore(task: Task, currentContext: string | null): number {
  let score = 0;

  if (currentContext && task.contextIds.includes(currentContext)) {
    score += 40;
  }

  const deadline = ensureDate(task.deadline);
  if (deadline) {
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
    await taskActions.update(taskId, { status: 'done' });
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

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-100';
    if (score >= 60) return 'text-blue-600 bg-blue-50 border-blue-100';
    if (score >= 40) return 'text-amber-600 bg-amber-50 border-amber-100';
    return 'text-slate-400 bg-slate-50 border-slate-100';
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Next Actions</h1>
        <p className="text-slate-500 mt-2">
          Your top {scoredTasks.length} priorities, calculated based on context, deadlines, and project importance.
        </p>
      </div>

      {currentContext && (
        <div className="mb-6 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-indigo-900">Active Context: @{currentContext}</p>
            <p className="text-xs text-indigo-700/70">Tasks are prioritized for your current environment.</p>
          </div>
        </div>
      )}

      {warning && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-rose-900">{warning}</p>
            <button
              type="button"
              onClick={() => setWarning(null)}
              className="text-xs text-rose-700 font-bold uppercase tracking-wider mt-1 hover:text-rose-800 transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {scoredTasks.length === 0 ? (
        <div className="text-center py-24 bg-white border border-slate-200 rounded-3xl">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Zap className="w-10 h-10 text-slate-300" />
          </div>
          <h3 className="text-xl font-bold text-slate-800">No actions recommended</h3>
          <p className="text-slate-500 mt-2 max-w-sm mx-auto px-4">
            Try switching contexts or adding more tasks to your inbox to see new recommendations.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {scoredTasks.map((task, index) => (
            <div key={task.id} className="relative pl-14">
              <div className="absolute left-0 top-4 flex flex-col items-center gap-1">
                <div className={`
                  w-10 h-10 rounded-full border-2 flex items-center justify-center text-sm font-bold shadow-sm
                  ${getScoreColor(task.score)}
                `}>
                  {task.score}
                </div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                  Rank #{index + 1}
                </div>
              </div>

              <TaskItem task={task} onEdit={handleEdit} />

              <div className="flex items-center gap-2 mt-3 ml-2">
                <button
                  type="button"
                  onClick={() => handleDoIt(task.id)}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 active:scale-95 transition-all shadow-sm"
                >
                  <Zap className="w-4 h-4 fill-current" />
                  Complete Now
                </button>
                <div className="h-4 w-px bg-slate-200 mx-1" />
                <button
                  type="button"
                  onClick={() => handleMoveToInbox(task.id)}
                  className="flex items-center gap-2 px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-sm font-medium transition-all"
                >
                  <ArrowDownToLine className="w-4 h-4" />
                  Move to Inbox
                </button>
                <button
                  type="button"
                  onClick={() => handleMoveToCalendar(task.id)}
                  className="flex items-center gap-2 px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-sm font-medium transition-all"
                >
                  <Calendar className="w-4 h-4" />
                  Schedule
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
