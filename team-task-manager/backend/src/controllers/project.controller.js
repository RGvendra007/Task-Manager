const { PrismaClient } = require('@prisma/client');
const { validationResult } = require('express-validator');
const { success, created, notFound, forbidden, badRequest, validationError } = require('../utils/response');

const prisma = new PrismaClient();

// ─── Get All Projects (for user) ─────────────────────────────────────────────
const getProjects = async (req, res, next) => {
  try {
    const projects = await prisma.project.findMany({
      where: {
        members: { some: { userId: req.user.id } },
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
        _count: { select: { tasks: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Attach user's role in each project
    const projectsWithRole = projects.map((p) => {
      const membership = p.members.find((m) => m.userId === req.user.id);
      return { ...p, myRole: membership?.role || 'MEMBER' };
    });

    return success(res, { projects: projectsWithRole });
  } catch (err) {
    next(err);
  }
};

// ─── Get Single Project ──────────────────────────────────────────────────────
const getProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        members: { some: { userId: req.user.id } },
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: {
          include: { user: { select: { id: true, name: true, email: true } } },
          orderBy: { joinedAt: 'asc' },
        },
        tasks: {
          include: {
            assignee: { select: { id: true, name: true, email: true } },
            creator: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!project) {
      return notFound(res, 'Project not found');
    }

    const membership = project.members.find((m) => m.userId === req.user.id);

    return success(res, { project: { ...project, myRole: membership?.role || 'MEMBER' } });
  } catch (err) {
    next(err);
  }
};

// ─── Create Project ──────────────────────────────────────────────────────────
const createProject = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return validationError(res, errors.array());

    const { name, description, color } = req.body;

    const project = await prisma.project.create({
      data: {
        name,
        description,
        color: color || '#6366f1',
        ownerId: req.user.id,
        members: {
          create: { userId: req.user.id, role: 'ADMIN' },
        },
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
        _count: { select: { tasks: true } },
      },
    });

    return created(res, { project: { ...project, myRole: 'ADMIN' } }, 'Project created');
  } catch (err) {
    next(err);
  }
};

// ─── Update Project ──────────────────────────────────────────────────────────
const updateProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { name, description, color } = req.body;

    const project = await prisma.project.update({
      where: { id: projectId },
      data: { name, description, color },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
        _count: { select: { tasks: true } },
      },
    });

    return success(res, { project }, 'Project updated');
  } catch (err) {
    next(err);
  }
};

// ─── Delete Project ──────────────────────────────────────────────────────────
const deleteProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return notFound(res);

    if (project.ownerId !== req.user.id) {
      return forbidden(res, 'Only the project owner can delete it');
    }

    await prisma.project.delete({ where: { id: projectId } });

    return success(res, {}, 'Project deleted');
  } catch (err) {
    next(err);
  }
};

// ─── Add Member ──────────────────────────────────────────────────────────────
const addMember = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return validationError(res, errors.array());

    const { projectId } = req.params;
    const { email, role } = req.body;

    const userToAdd = await prisma.user.findUnique({ where: { email } });
    if (!userToAdd) return notFound(res, 'User not found with that email');

    const existing = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: userToAdd.id } },
    });

    if (existing) return badRequest(res, 'User is already a member of this project');

    const member = await prisma.projectMember.create({
      data: { projectId, userId: userToAdd.id, role: role || 'MEMBER' },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    return created(res, { member }, 'Member added');
  } catch (err) {
    next(err);
  }
};

// ─── Update Member Role ───────────────────────────────────────────────────────
const updateMemberRole = async (req, res, next) => {
  try {
    const { projectId, memberId } = req.params;
    const { role } = req.body;

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return notFound(res);

    if (memberId === project.ownerId) {
      return forbidden(res, 'Cannot change the role of the project owner');
    }

    const member = await prisma.projectMember.update({
      where: { projectId_userId: { projectId, userId: memberId } },
      data: { role },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    return success(res, { member }, 'Member role updated');
  } catch (err) {
    next(err);
  }
};

// ─── Remove Member ────────────────────────────────────────────────────────────
const removeMember = async (req, res, next) => {
  try {
    const { projectId, memberId } = req.params;

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return notFound(res);

    if (memberId === project.ownerId) {
      return forbidden(res, 'Cannot remove the project owner');
    }

    await prisma.projectMember.delete({
      where: { projectId_userId: { projectId, userId: memberId } },
    });

    return success(res, {}, 'Member removed');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  addMember,
  updateMemberRole,
  removeMember,
};
