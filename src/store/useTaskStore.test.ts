import { describe, it, expect, beforeEach } from 'vitest';
import { useTaskStore } from './useTaskStore';
import { db } from '../db';

describe('Task Store Actions', () => {
  beforeEach(async () => {
    // Re-open and clear for each test to ensure fresh state
    if (!db.isOpen()) {
      await db.open();
    }
    await db.tasks.clear();
    await db.projects.clear();
    await db.tags.clear();
    await db.contexts.clear();

    // Reset Zustand store state
    useTaskStore.setState({
      tasks: [],
      projects: [],
      tags: [],
      contexts: [],
      currentContext: null,
      initialized: false
    });

    const { initialize } = useTaskStore.getState();
    await initialize();
  });

  describe('completedAt management', () => {
    it('should set completedAt when task is added as done', async () => {
      const { taskActions } = useTaskStore.getState();
      const task = await taskActions.add({
        title: 'Done Task',
        status: 'done',
        tagIds: [],
        contextIds: []
      });

      expect(task.completedAt).toBeDefined();
    });

    it('should not set completedAt when task is added as next', async () => {
      const { taskActions } = useTaskStore.getState();
      const task = await taskActions.add({
        title: 'Next Task',
        status: 'next',
        tagIds: [],
        contextIds: []
      });

      expect(task.completedAt).toBeUndefined();
    });

    it('should set completedAt when updating status to done', async () => {
      const { taskActions } = useTaskStore.getState();
      const task = await taskActions.add({
        title: 'Next Task',
        status: 'next',
        tagIds: [],
        contextIds: []
      });

      await taskActions.update(task.id, { status: 'done' });

      const updatedTask = useTaskStore.getState().tasks.find(t => t.id === task.id);
      expect(updatedTask?.completedAt).toBeDefined();
    });

    it('should clear completedAt when updating status from done to next', async () => {
      const { taskActions } = useTaskStore.getState();
      const task = await taskActions.add({
        title: 'Done Task',
        status: 'done',
        tagIds: [],
        contextIds: []
      });

      await taskActions.update(task.id, { status: 'next' });

      const updatedTask = useTaskStore.getState().tasks.find(t => t.id === task.id);
      expect(updatedTask?.completedAt).toBeUndefined();
    });
  });

  describe('Deletion Cleanup', () => {
    it('should clear projectId when project is deleted', async () => {
      const { projectActions, taskActions } = useTaskStore.getState();

      const project = await projectActions.add({ name: 'Test Project', color: '#ff0000' });
      const task = await taskActions.add({
        title: 'Task with Project',
        status: 'inbox',
        projectId: project.id,
        tagIds: [],
        contextIds: []
      });

      await projectActions.delete(project.id);

      const updatedTask = useTaskStore.getState().tasks.find(t => t.id === task.id);
      expect(updatedTask?.projectId).toBeUndefined();
    });

    it('should remove tagId from tagIds when tag is deleted', async () => {
      const { tagActions, taskActions } = useTaskStore.getState();

      const tag = await tagActions.add({ name: 'Urgent', color: '#ff0000' });
      const task = await taskActions.add({
        title: 'Task with Tag',
        status: 'inbox',
        tagIds: [tag.id],
        contextIds: []
      });

      await tagActions.delete(tag.id);

      const updatedTask = useTaskStore.getState().tasks.find(t => t.id === task.id);
      expect(updatedTask?.tagIds).not.toContain(tag.id);
    });

    it('should remove contextId from contextIds when context is deleted', async () => {
      const { contextActions, taskActions } = useTaskStore.getState();

      const context = await contextActions.add({ name: 'Home', icon: 'Home' });
      const task = await taskActions.add({
        title: 'Task with Context',
        status: 'inbox',
        tagIds: [],
        contextIds: [context.id]
      });

      await contextActions.delete(context.id);

      const updatedTask = useTaskStore.getState().tasks.find(t => t.id === task.id);
      expect(updatedTask?.contextIds).not.toContain(context.id);
    });

    it('should clear currentContext when active context is deleted', async () => {
      const { contextActions } = useTaskStore.getState();

      const context = await contextActions.add({ name: 'Office', icon: 'Building' });
      contextActions.setCurrentContext(context.id);
      expect(useTaskStore.getState().currentContext).toBe(context.id);

      await contextActions.delete(context.id);

      expect(useTaskStore.getState().currentContext).toBeNull();
    });

    it('should clear dependsOnTaskId when blocking task is deleted', async () => {
      const { taskActions } = useTaskStore.getState();

      const blockingTask = await taskActions.add({
        title: 'Blocking Task',
        status: 'next',
        tagIds: [],
        contextIds: []
      });

      const blockedTask = await taskActions.add({
        title: 'Blocked Task',
        status: 'next',
        dependsOnTaskId: blockingTask.id,
        tagIds: [],
        contextIds: []
      });

      await taskActions.delete(blockingTask.id);

      const updatedTask = useTaskStore.getState().tasks.find(t => t.id === blockedTask.id);
      expect(updatedTask?.dependsOnTaskId).toBeUndefined();
    });
  });
});
