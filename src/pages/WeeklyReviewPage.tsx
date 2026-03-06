import { useState } from 'react';
import {
  addWeeks,
  endOfWeek,
  format,
  isAfter,
  isBefore,
  startOfWeek,
} from 'date-fns';
import { CheckCircle2, AlertTriangle, Clock3, MoveRight } from 'lucide-react';
import { useTaskStore } from '../store/useTaskStore';
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
    if (!task.deadline) {
      return false;
    }

    return isBefore(new Date(task.deadline), now);
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
      if (left.deadline && right.deadline) {
        return new Date(left.deadline).getTime() - new Date(right.deadline).getTime();
      }

      if (left.deadline) {
        return -1;
      }

      if (right.deadline) {
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

          const nextDeadline = new Date(nextWeekStart);

          if (task.deadline) {
            const previousDeadline = new Date(task.deadline);
            nextDeadline.setHours(
              previousDeadline.getHours(),
              previousDeadline.getMinutes(),
              previousDeadline.getSeconds(),
              previousDeadline.getMilliseconds(),
            );
          } else {
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
        deadline: new Date(nextWeekDeadline),
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
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">Weekly Review</h1>
        <p className="text-sm text-slate-500 mt-1">
          Week window: {format(currentWeekStart, 'MMM d')} - {format(currentWeekEnd, 'MMM d')} (through now)
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-3">
        <article className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-600">Completed This Week</p>
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-3xl font-semibold text-slate-800 mt-2">{completedThisWeek.length}</p>
        </article>

        <article className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-600">Overdue</p>
            <AlertTriangle className="w-5 h-5 text-rose-600" />
          </div>
          <p className="text-3xl font-semibold text-slate-800 mt-2">{overdueCount}</p>
        </article>

        <article className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-600">Pending</p>
            <Clock3 className="w-5 h-5 text-amber-600" />
          </div>
          <p className="text-3xl font-semibold text-slate-800 mt-2">{pendingCount}</p>
        </article>
      </section>

      <section className="bg-white border border-slate-200 rounded-lg shadow-sm">
        <div className="px-5 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">Completed Tasks This Week</h2>
          <p className="text-sm text-slate-500 mt-1">Most recent 10 completed tasks</p>
        </div>

        {recentCompletedTasks.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-slate-500">
            No tasks completed this week yet.
          </div>
        ) : (
          <ul className="divide-y divide-slate-200">
            {recentCompletedTasks.map((task) => (
              <li key={task.id} className="px-5 py-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-slate-800 truncate">{task.title}</p>
                  {task.description && (
                    <p className="text-sm text-slate-500 mt-1 line-clamp-2">{task.description}</p>
                  )}
                </div>
                <p className="text-xs text-slate-500 whitespace-nowrap">
                  {format(new Date(task.completedAt), 'EEE, MMM d')}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="bg-white border border-slate-200 rounded-lg shadow-sm">
        <div className="px-5 py-4 border-b border-slate-200 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Carry Over Incomplete Tasks</h2>
            <p className="text-sm text-slate-500 mt-1">
              Select tasks and move deadlines to next Monday ({format(nextWeekStart, 'MMM d')})
            </p>
          </div>
          <button
            type="button"
            onClick={handleCarryOver}
            disabled={selectedCarryOverIds.length === 0 || isCarryingOver}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed"
          >
            <MoveRight className="w-4 h-4" />
            {isCarryingOver ? 'Carrying Over...' : `Carry Over Selected (${selectedCarryOverIds.length})`}
          </button>
        </div>

        {incompleteTasks.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-slate-500">
            No incomplete tasks to carry over.
          </div>
        ) : (
          <ul className="divide-y divide-slate-200 max-h-80 overflow-auto">
            {incompleteTasks.map((task) => (
              <li key={task.id} className="px-5 py-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedCarryOverIds.includes(task.id)}
                    onChange={() => toggleCarryOver(task.id)}
                    className="mt-1 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="min-w-0">
                    <span className="block font-medium text-slate-800 truncate">{task.title}</span>
                    <span
                      className={`block text-xs mt-1 ${
                        isOverdue(task) ? 'text-rose-600' : 'text-slate-500'
                      }`}
                    >
                      {task.deadline
                        ? `Current deadline: ${format(new Date(task.deadline), 'EEE, MMM d')}`
                        : 'No deadline yet'}
                    </span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="bg-white border border-slate-200 rounded-lg shadow-sm">
        <div className="px-5 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">Add for Next Week</h2>
          <p className="text-sm text-slate-500 mt-1">
            Quickly add tasks with a next-week deadline.
          </p>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            void handleQuickAddForNextWeek();
          }}
          className="px-5 py-4 grid gap-3 sm:grid-cols-[1fr_180px_auto]"
        >
          <input
            type="text"
            value={nextWeekTitle}
            onChange={(event) => setNextWeekTitle(event.target.value)}
            placeholder="Task title for next week"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="date"
            value={nextWeekDeadline}
            min={nextWeekDateInput}
            onChange={(event) => setNextWeekDeadline(event.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <button
            type="submit"
            disabled={isAddingTask}
            className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed"
          >
            {isAddingTask ? 'Adding...' : 'Add Task'}
          </button>
        </form>
      </section>
    </div>
  );
}
