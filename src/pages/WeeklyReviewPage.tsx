import { useState } from 'react';
import {
  addWeeks,
  endOfWeek,
  format,
  isAfter,
  isBefore,
  startOfWeek,
} from 'date-fns';
import { CheckCircle2, AlertTriangle, Clock3, MoveRight, Calendar, Plus } from 'lucide-react';
import { useTaskStore } from '../store/useTaskStore';
import { ensureDate, shiftDatePreservingTime, parseDateFromInput } from '../utils/dateUtils';
import type { Task } from '../types';

function hasStarted(date: Date, boundary: Date): boolean {
  return isAfter(date, boundary) || date.getTime() === boundary.getTime();
}

function hasNotPassed(date: Date, boundary: Date): boolean {
  return isBefore(date, boundary) || date.getTime() === boundary.getTime();
}

export function WeeklyReviewPage() {
  const { tasks, taskActions } = useTaskStore();
  const [selectedCarryOverIds, setSelectedCarryOverIds] = useState<string[]>([]);
  const [isCarryingOver, setIsCarryingOver] = useState(false);
  const [nextWeekTitle, setNextWeekTitle] = useState('');
  const [isAddingTask, setIsAddingTask] = useState(false);

  const now = new Date();
  const currentWeekStart = startOfWeek(now, { weekStartsOn: 1 });
  const currentWeekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const nextWeekStart = addWeeks(currentWeekStart, 1);
  const nextWeekDateInput = format(nextWeekStart, 'yyyy-MM-dd');
  const [nextWeekDeadline, setNextWeekDeadline] = useState(nextWeekDateInput);

  const isWithinCurrentWeekToNow = (date: Date): boolean => {
    return hasStarted(date, currentWeekStart) && hasNotPassed(date, now);
  };

  const isOverdue = (task: Task): boolean => {
    const deadline = ensureDate(task.deadline);
    if (!deadline) {
      return false;
    }

    return isBefore(deadline, now);
  };

  const completedThisWeek = tasks
    .filter(
      (task): task is Task & { completedAt: Date } =>
        task.status === 'done' && task.completedAt !== undefined,
    )
    .filter((task) => isWithinCurrentWeekToNow(new Date(task.completedAt)))
    .sort(
      (left, right) =>
        new Date(right.completedAt).getTime() - new Date(left.completedAt).getTime(),
    );

  const incompleteTasks = tasks
    .filter((task) => task.status !== 'done')
    .sort((left, right) => {
      const leftDeadline = ensureDate(left.deadline);
      const rightDeadline = ensureDate(right.deadline);

      if (leftDeadline && rightDeadline) {
        return leftDeadline.getTime() - rightDeadline.getTime();
      }

      if (leftDeadline) {
        return -1;
      }

      if (rightDeadline) {
        return 1;
      }

      return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
    });

  const overdueCount = incompleteTasks.filter(isOverdue).length;
  const pendingCount = incompleteTasks.length - overdueCount;
  const recentCompletedTasks = completedThisWeek.slice(0, 10);
  const carryOverTaskMap = new Map(incompleteTasks.map((task) => [task.id, task]));

  const toggleCarryOver = (taskId: string) => {
    setSelectedCarryOverIds((previous) =>
      previous.includes(taskId)
        ? previous.filter((selectedId) => selectedId !== taskId)
        : [...previous, taskId],
    );
  };

  const handleCarryOver = async () => {
    if (selectedCarryOverIds.length === 0) {
      return;
    }

    setIsCarryingOver(true);

    try {
      await Promise.all(
        selectedCarryOverIds.map(async (taskId) => {
          const task = carryOverTaskMap.get(taskId);
          if (!task) {
            return;
          }

          const currentDeadline = ensureDate(task.deadline);
          let nextDeadline: Date;

          if (currentDeadline) {
            nextDeadline = shiftDatePreservingTime(currentDeadline, nextWeekStart);
          } else {
            nextDeadline = new Date(nextWeekStart);
            nextDeadline.setHours(9, 0, 0, 0);
          }

          await taskActions.update(taskId, { deadline: nextDeadline });
        }),
      );

      setSelectedCarryOverIds([]);
    } finally {
      setIsCarryingOver(false);
    }
  };

  const handleQuickAddForNextWeek = async () => {
    const title = nextWeekTitle.trim();

    if (!title) {
      return;
    }

    setIsAddingTask(true);

    try {
      await taskActions.add({
        title,
        description: undefined,
        projectId: undefined,
        tagIds: [],
        contextIds: [],
        deadline: parseDateFromInput(nextWeekDeadline, nextWeekStart),
        estimatedMinutes: undefined,
        dependsOnTaskId: undefined,
        status: 'inbox',
        completedAt: undefined,
      });

      setNextWeekTitle('');
      setNextWeekDeadline(nextWeekDateInput);
    } finally {
      setIsAddingTask(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-12">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Weekly Review</h1>
        <p className="text-slate-500 mt-2 flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Window: <span className="font-semibold text-slate-700">{format(currentWeekStart, 'MMMM d')} - {format(currentWeekEnd, 'MMMM d')}</span>
        </p>
      </div>

      <section className="grid gap-6 sm:grid-cols-3">
        <article className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm group hover:border-green-200 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-green-600 group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-green-600 uppercase tracking-wider">Velocity</span>
          </div>
          <p className="text-sm font-medium text-slate-500">Completed This Week</p>
          <p className="text-4xl font-bold text-slate-900 mt-1">{completedThisWeek.length}</p>
        </article>

        <article className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm group hover:border-rose-200 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 group-hover:scale-110 transition-transform">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">Attention</span>
          </div>
          <p className="text-sm font-medium text-slate-500">Overdue Tasks</p>
          <p className="text-4xl font-bold text-slate-900 mt-1">{overdueCount}</p>
        </article>

        <article className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm group hover:border-amber-200 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
              <Clock3 className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Backlog</span>
          </div>
          <p className="text-sm font-medium text-slate-500">Pending Actions</p>
          <p className="text-4xl font-bold text-slate-900 mt-1">{pendingCount}</p>
        </article>
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
            <h2 className="text-lg font-bold text-slate-900">Recently Completed</h2>
            <p className="text-xs text-slate-500 mt-1">Great job! Here is what you achieved lately.</p>
          </div>

          <div className="flex-1 min-h-[300px]">
            {recentCompletedTasks.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-4 text-slate-300">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <p className="text-sm text-slate-400">No tasks completed yet this week.</p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {recentCompletedTasks.map((task) => (
                  <li key={task.id} className="px-6 py-4 flex items-start justify-between gap-4 group hover:bg-slate-50/50 transition-colors">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800 truncate">{task.title}</p>
                      {task.description && (
                        <p className="text-xs text-slate-500 mt-1 line-clamp-1 italic">{task.description}</p>
                      )}
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap bg-slate-100 px-2 py-1 rounded-md uppercase tracking-tighter">
                      {format(new Date(task.completedAt), 'MMM d')}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Carry Over</h2>
              <p className="text-xs text-slate-500 mt-1">Move pending tasks to next week.</p>
            </div>
            <button
              type="button"
              onClick={handleCarryOver}
              disabled={selectedCarryOverIds.length === 0 || isCarryingOver}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95"
            >
              <MoveRight className="w-4 h-4" />
              {isCarryingOver ? 'Processing...' : `Move (${selectedCarryOverIds.length})`}
            </button>
          </div>

          <div className="flex-1 max-h-[400px] overflow-auto">
            {incompleteTasks.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-4 text-slate-300">
                  <Clock3 className="w-6 h-6" />
                </div>
                <p className="text-sm text-slate-400">Everything is up to date.</p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {incompleteTasks.map((task) => (
                  <li key={task.id} className="px-6 py-4 group hover:bg-slate-50/50 transition-colors">
                    <label className="flex items-start gap-4 cursor-pointer">
                      <div className="relative mt-1">
                        <input
                          type="checkbox"
                          checked={selectedCarryOverIds.includes(task.id)}
                          onChange={() => toggleCarryOver(task.id)}
                          className="peer appearance-none w-5 h-5 rounded-md border-2 border-slate-200 checked:bg-blue-600 checked:border-blue-600 transition-all cursor-pointer"
                        />
                        <CheckCircle2 className="absolute top-0.5 left-0.5 w-4 h-4 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
                      </div>
                      <div className="min-w-0">
                        <span className="block font-semibold text-slate-800 truncate">{task.title}</span>
                        <span
                          className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider mt-1.5 ${
                            isOverdue(task) ? 'text-rose-500' : 'text-slate-400'
                          }`}
                        >
                          {ensureDate(task.deadline) ? (
                            <>
                              <Calendar className="w-3 h-3" />
                              {format(ensureDate(task.deadline)!, 'MMM d, yyyy')}
                            </>
                          ) : 'No deadline'}
                        </span>
                      </div>
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>

      <section className="bg-slate-900 rounded-3xl p-8 shadow-xl text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Plus className="w-32 h-32" />
        </div>

        <div className="relative z-10">
          <h2 className="text-2xl font-bold">Plan Ahead</h2>
          <p className="text-slate-400 mt-2">Add essential tasks for the upcoming week starting {format(nextWeekStart, 'MMM d')}.</p>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              void handleQuickAddForNextWeek();
            }}
            className="mt-8 flex flex-col sm:flex-row gap-4"
          >
            <div className="flex-1 flex flex-col gap-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Task Title</label>
              <input
                type="text"
                value={nextWeekTitle}
                onChange={(event) => setNextWeekTitle(event.target.value)}
                placeholder="What is next on your list?"
                className="w-full bg-slate-800 border-slate-700 text-white rounded-xl px-4 py-3 placeholder:text-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                required
              />
            </div>
            <div className="w-full sm:w-48 flex flex-col gap-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Deadline</label>
              <input
                type="date"
                value={nextWeekDeadline}
                min={nextWeekDateInput}
                onChange={(event) => setNextWeekDeadline(event.target.value)}
                className="w-full bg-slate-800 border-slate-700 text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                required
              />
            </div>
            <div className="flex flex-col gap-2 pt-6">
              <button
                type="submit"
                disabled={isAddingTask}
                className="h-[52px] px-8 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/20 active:scale-95"
              >
                {isAddingTask ? 'Adding...' : 'Add Task'}
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
