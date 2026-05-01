const { PrismaClient } = require('@prisma/client');
const { success } = require('../utils/response');

const prisma = new PrismaClient();

const getDashboard = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [myTasks, overdueTasks, projects, recentTasks] = await Promise.all([
      prisma.task.groupBy({
        by: ['status'],
        where: { assigneeId: userId },
        _count: { status: true },
      }),
      prisma.task.count({
        where: {
          assigneeId: userId,
          dueDate: { lt: new Date() },
          status: { not: 'DONE' },
        },
      }),
      prisma.project.findMany({
        where: { members: { some: { userId } } },
        include: {
          _count: { select: { tasks: true } },
          members: { select: { role: true, userId: true } },
        },
        orderBy: { updatedAt: 'desc' },
        take: 5,
      }),
      prisma.task.findMany({
        where: {
          project: { members: { some: { userId } } },
        },
        include: {
          project: { select: { id: true, name: true, color: true } },
          assignee: { select: { id: true, name: true } },
        },
        orderBy: { updatedAt: 'desc' },
        take: 10,
      }),
    ]);

    const taskStats = { TODO: 0, IN_PROGRESS: 0, IN_REVIEW: 0, DONE: 0 };
    myTasks.forEach((t) => { taskStats[t.status] = t._count.status; });

    const projectsWithRole = projects.map((p) => {
      const membership = p.members.find((m) => m.userId === userId);
      return { ...p, myRole: membership?.role || 'MEMBER' };
    });

    return success(res, {
      taskStats,
      overdueTasks,
      totalTasks: Object.values(taskStats).reduce((a, b) => a + b, 0),
      projects: projectsWithRole,
      recentTasks,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getDashboard };
