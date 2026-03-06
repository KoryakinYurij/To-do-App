import { useState } from 'react';
import { Plus } from 'lucide-react';
import { ProjectForm } from '../components/ProjectForm';
import { ProjectList } from '../components/ProjectList';
import { TagForm } from '../components/TagForm';
import { TagList } from '../components/TagList';
import type { Project, Tag } from '../types';

export function ProjectsPage() {
  const [isProjectFormOpen, setProjectFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  
  const [isTagFormOpen, setTagFormOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setProjectFormOpen(true);
  };

  const handleEditTag = (tag: Tag) => {
    setEditingTag(tag);
    setTagFormOpen(true);
  };

  const closeProjectForm = () => {
    setProjectFormOpen(false);
    setEditingProject(null);
  };

  const closeTagForm = () => {
    setTagFormOpen(false);
    setEditingTag(null);
  };

  return (
    <div className="space-y-8">
      <section>
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold text-slate-800">Projects</h1>
          <button
            type="button"
            onClick={() => setProjectFormOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Project
          </button>
        </div>
        <ProjectList onEdit={handleEditProject} />
        <ProjectForm 
          open={isProjectFormOpen} 
          onOpenChange={closeProjectForm}
          editProject={editingProject}
        />
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold text-slate-800">Tags</h1>
          <button
            type="button"
            onClick={() => setTagFormOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Tag
          </button>
        </div>
        <TagList onEdit={handleEditTag} />
        <TagForm 
          open={isTagFormOpen} 
          onOpenChange={closeTagForm}
          editTag={editingTag}
        />
      </section>
    </div>
  );
}
