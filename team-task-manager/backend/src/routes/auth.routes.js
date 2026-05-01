const express = require('express');
const { body } = require('express-validator');
const { signup, login, getMe, updateProfile } = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/signup', [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ min: 2, max: 50 }),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
], signup);

router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], login);

router.get('/me', authenticate, getMe);
router.patch('/profile', authenticate, [
  body('name').trim().notEmpty().isLength({ min: 2, max: 50 }),
], updateProfile);

module.exports = router;
