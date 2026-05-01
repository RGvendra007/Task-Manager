const { PrismaClient } = require('@prisma/client');
const { forbidden, notFound } = require('../utils/response');

const prisma = new PrismaClient();

/**
 * Checks if the authenticated user is an ADMIN of the given project.
 * Requires :projectId in route params.
 */
const requireProjectAdmin = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    const membership = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: req.user.id,
        },
      },
    });

    if (!membership) {
      return notFound(res, 'Project not found or you are not a member');
    }

    if (membership.role !== 'ADMIN') {
      return forbidden(res, 'Only project admins can perform this action');
    }

    req.membership = membership;
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Checks if the authenticated user is a member (any role) of the given project.
 * Requires :projectId in route params.
 */
const requireProjectMember = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    const membership = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: req.user.id,
        },
      },
    });

    if (!membership) {
      return notFound(res, 'Project not found or you are not a member');
    }

    req.membership = membership;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { requireProjectAdmin, requireProjectMember };
