const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const { generateToken } = require('../utils/jwt');
const { success, created, badRequest, unauthorized, validationError } = require('../utils/response');

const prisma = new PrismaClient();

// ─── Signup ──────────────────────────────────────────────────────────────────
const signup = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return validationError(res, errors.array());
    }

    const { name, email, password } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return badRequest(res, 'Email already in use');
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword },
      select: { id: true, name: true, email: true, createdAt: true },
    });

    const token = generateToken({ userId: user.id });

    return created(res, { user, token }, 'Account created successfully');
  } catch (err) {
    next(err);
  }
};

// ─── Login ───────────────────────────────────────────────────────────────────
const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return validationError(res, errors.array());
    }

    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return unauthorized(res, 'Invalid email or password');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return unauthorized(res, 'Invalid email or password');
    }

    const token = generateToken({ userId: user.id });

    const { password: _pwd, ...userWithoutPassword } = user;

    return success(res, { user: userWithoutPassword, token }, 'Login successful');
  } catch (err) {
    next(err);
  }
};

// ─── Get Me ──────────────────────────────────────────────────────────────────
const getMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        _count: {
          select: {
            ownedProjects: true,
            assignedTasks: true,
          },
        },
      },
    });

    return success(res, { user });
  } catch (err) {
    next(err);
  }
};

// ─── Update Profile ──────────────────────────────────────────────────────────
const updateProfile = async (req, res, next) => {
  try {
    const { name } = req.body;

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { name },
      select: { id: true, name: true, email: true, createdAt: true },
    });

    return success(res, { user }, 'Profile updated');
  } catch (err) {
    next(err);
  }
};

module.exports = { signup, login, getMe, updateProfile };
