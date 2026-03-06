import { useMemo, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { EventClickArg, EventDropArg, EventInput } from '@fullcalendar/core';
import { useTaskStore } from '../store/useTaskStore';
import { TaskModal } from '../components/TaskModal';
import type { Task } from '../types';

const DEFAULT_EVENT_DURATION_MINUTES = 60;
const FALLBACK_EVENT_COLOR = '#3b82f6';

export function CalendarPage() {
  const { tasks, projects, taskActions } = useTaskStore();
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const calendaredTasks = useMemo(
    () =>
      tasks.filter(
        (task): task is Task & { deadline: Date } =>
          task.status === 'calendared' && task.deadline !== undefined,
      ),
    [tasks],
  );

  const selectedTask = useMemo<Task | null>(() => {
    if (!selectedTaskId) {
      return null;
    }

    return tasks.find((task) => task.id === selectedTaskId) ?? null;
  }, [selectedTaskId, tasks]);

  const calendarEvents = useMemo<EventInput[]>(() => {
    return calendaredTasks.map((task) => {
      const project = projects.find((p) => p.id === task.projectId);
      const start = new Date(task.deadline);
      const durationMinutes = task.estimatedMinutes ?? DEFAULT_EVENT_DURATION_MINUTES;
      const end = new Date(start.getTime() + durationMinutes * 60000);

      return {
        id: task.id,
        title: task.title,
        start,
        end,
        backgroundColor: project?.color ?? FALLBACK_EVENT_COLOR,
        borderColor: project?.color ?? FALLBACK_EVENT_COLOR,
      };
    });
  }, [calendaredTasks, projects]);

  const handleEventClick = (info: EventClickArg) => {
    const task = tasks.find((candidate) => candidate.id === info.event.id);

    if (task) {
      setSelectedTaskId(task.id);
    }
  };

  const handleEventDrop = async (info: EventDropArg) => {
    const newDeadline = info.event.start;

    if (!newDeadline) {
      info.revert();
      return;
    }

    try {
      await taskActions.update(info.event.id, {
        deadline: newDeadline,
      });
    } catch {
      info.revert();
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold text-slate-800">Calendar</h1>
        <p className="text-sm text-slate-500 mt-1">
          {calendarEvents.length} scheduled tasks
        </p>
      </div>

      <div className="flex-1 bg-white rounded-lg shadow p-4">
        <FullCalendar
          plugins={[timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: '',
          }}
          events={calendarEvents}
          eventClick={handleEventClick}
          editable={true}
          eventDrop={handleEventDrop}
          slotMinTime="06:00:00"
          slotMaxTime="22:00:00"
          allDaySlot={false}
          height="auto"
          nowIndicator={true}
          eventTimeFormat={{
            hour: 'numeric',
            minute: '2-digit',
            meridiem: 'short',
          }}
        />
      </div>

      <TaskModal
        open={!!selectedTask}
        onOpenChange={(open) => !open && setSelectedTaskId(null)}
        editTask={selectedTask}
      />
    </div>
  );
}
