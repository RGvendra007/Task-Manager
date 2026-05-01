const { PrismaClient } = require('@prisma/client');
const { verifyToken } = require('../utils/jwt');
const { unauthorized } = require('../utils/response');

const prisma = new PrismaClient();

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return unauthorized(res, 'No token provided');
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, name: true, email: true, createdAt: true },
    });

    if (!user) {
      return unauthorized(res, 'User not found');
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return unauthorized(res, 'Invalid token');
    }
    if (err.name === 'TokenExpiredError') {
      return unauthorized(res, 'Token expired');
    }
    next(err);
  }
};

module.exports = { authenticate };
