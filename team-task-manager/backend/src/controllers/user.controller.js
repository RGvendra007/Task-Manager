const { PrismaClient } = require('@prisma/client');
const { success } = require('../utils/response');

const prisma = new PrismaClient();

const searchUsers = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) return success(res, { users: [] });

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { email: { contains: q, mode: 'insensitive' } },
          { name: { contains: q, mode: 'insensitive' } },
        ],
        NOT: { id: req.user.id },
      },
      select: { id: true, name: true, email: true },
      take: 10,
    });

    return success(res, { users });
  } catch (err) {
    next(err);
  }
};

module.exports = { searchUsers };
