const { PrismaClient } = require('@prisma/client');
const { validationResult } = require('express-validator');
const { success, created, notFound, forbidden, validationError } = require('../utils/response');

const prisma = new PrismaClient();

// ─── Get Tasks for Project ───────────────────────────────────────────────────
const getProjectTasks = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { status, priority, assigneeId } = req.query;

    const where = { projectId };
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (assigneeId) where.assigneeId = assigneeId;

    const tasks = await prisma.task.findMany({
      where,
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return success(res, { tasks });
  } catch (err) {
    next(err);
  }
};

// ─── Get Single Task ─────────────────────────────────────────────────────────
const getTask = async (req, res, next) => {
  try {
    const { taskId } = req.params;

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true, color: true } },
      },
    });

    if (!task) return notFound(res, 'Task not found');

    // Verify user is a member of the project
    const membership = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: task.projectId, userId: req.user.id } },
    });

    if (!membership) return notFound(res, 'Task not found');

    return success(res, { task });
  } catch (err) {
    next(err);
  }
};

// ─── Create Task ─────────────────────────────────────────────────────────────
const createTask = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return validationError(res, errors.array());

    const { projectId } = req.params;
    const { title, description, status, priority, dueDate, assigneeId } = req.body;

    // Validate assignee is a project member
    if (assigneeId) {
      const assigneeMembership = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId, userId: assigneeId } },
      });
      if (!assigneeMembership) {
        return notFound(res, 'Assignee is not a member of this project');
      }
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        status: status || 'TODO',
        priority: priority || 'MEDIUM',
        dueDate: dueDate ? new Date(dueDate) : null,
        projectId,
        assigneeId: assigneeId || null,
        creatorId: req.user.id,
      },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true, email: true } },
      },
    });

    return created(res, { task }, 'Task created');
  } catch (err) {
    next(err);
  }
};

// ─── Update Task ─────────────────────────────────────────────────────────────
const updateTask = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const { title, description, status, priority, dueDate, assigneeId } = req.body;

    const existing = await prisma.task.findUnique({ where: { id: taskId } });
    if (!existing) return notFound(res, 'Task not found');

    // Verify user is a member
    const membership = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: existing.projectId, userId: req.user.id } },
    });
    if (!membership) return notFound(res, 'Task not found');

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;
    if (priority !== undefined) updateData.priority = priority;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
    if (assigneeId !== undefined) updateData.assigneeId = assigneeId || null;

    const task = await prisma.task.update({
      where: { id: taskId },
      data: updateData,
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true, color: true } },
      },
    });

    return success(res, { task }, 'Task updated');
  } catch (err) {
    next(err);
  }
};

// ─── Delete Task ─────────────────────────────────────────────────────────────
const deleteTask = async (req, res, next) => {
  try {
    const { taskId } = req.params;

    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) return notFound(res, 'Task not found');

    const membership = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: task.projectId, userId: req.user.id } },
    });

    if (!membership) return notFound(res, 'Task not found');

    // Only task creator or project admin can delete
    if (task.creatorId !== req.user.id && membership.role !== 'ADMIN') {
      return forbidden(res, 'Only the task creator or project admin can delete this task');
    }

    await prisma.task.delete({ where: { id: taskId } });

    return success(res, {}, 'Task deleted');
  } catch (err) {
    next(err);
  }
};

// ─── Get My Tasks (across all projects) ─────────────────────────────────────
const getMyTasks = async (req, res, next) => {
  try {
    const tasks = await prisma.task.findMany({
      where: { assigneeId: req.user.id },
      include: {
        project: { select: { id: true, name: true, color: true } },
        creator: { select: { id: true, name: true, email: true } },
      },
      orderBy: { dueDate: 'asc' },
    });

    return success(res, { tasks });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getProjectTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  getMyTasks,
};
