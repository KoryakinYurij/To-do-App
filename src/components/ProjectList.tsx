import { Pencil, Trash2, Archive } from 'lucide-react';
import { useState } from 'react';
import { useTaskStore } from '../store/useTaskStore';
import type { Project } from '../types';

interface ProjectListProps {
  onEdit: (project: Project) => void;
}

export function ProjectList({ onEdit }: ProjectListProps) {
  const { projects, projectActions, tasks } = useTaskStore();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const activeProjects = projects.filter(p => !p.archived);
  const archivedProjects = projects.filter(p => p.archived);

  const getTaskCount = (projectId: string) => {
    return tasks.filter(t => t.projectId === projectId && t.status !== 'done').length;
  };

  const handleDelete = async (id: string) => {
    if (deletingId === id) {
      await projectActions.delete(id);
      setDeletingId(null);
    } else {
      setDeletingId(id);
      setTimeout(() => setDeletingId(null), 3000);
    }
  };

  const handleArchive = async (id: string, archived: boolean) => {
    await projectActions.update(id, { archived: !archived });
  };

  const renderProject = (project: Project) => {
    const taskCount = getTaskCount(project.id);

    return (
      <div 
        key={project.id}
        className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-lg"
      >
        <div className="flex items-center gap-3">
          <div 
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: project.color }}
          />
          <div>
            <h3 className="font-medium text-slate-800">{project.name}</h3>
            <p className="text-sm text-slate-500">{taskCount} active tasks</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onEdit(project)}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-500"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleArchive(project.id, !!project.archived)}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-500"
            title={project.archived ? 'Unarchive' : 'Archive'}
          >
            <Archive className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleDelete(project.id)}
            className={`p-2 rounded-lg ${
              deletingId === project.id 
                ? 'bg-red-100 text-red-600' 
                : 'hover:bg-slate-100 text-slate-500'
            }`}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {activeProjects.length === 0 && archivedProjects.length === 0 ? (
        <div className="text-center py-8 text-slate-500">
          No projects yet
        </div>
      ) : (
        <>
          {activeProjects.map(renderProject)}
          
          {archivedProjects.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-medium text-slate-500 mb-2">
                Archived ({archivedProjects.length})
              </h4>
              <div className="space-y-2 opacity-60">
                {archivedProjects.map(renderProject)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
