const express = require('express');
const { body } = require('express-validator');
const {
  getProjectTasks, getTask, createTask, updateTask, deleteTask, getMyTasks,
} = require('../controllers/task.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireProjectMember } = require('../middleware/role.middleware');

const router = express.Router();
router.use(authenticate);

router.get('/my', getMyTasks);
router.get('/:taskId', getTask);
router.patch('/:taskId', [
  body('status').optional().isIn(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']),
  body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
], updateTask);
router.delete('/:taskId', deleteTask);

// Project-scoped task routes
router.get('/project/:projectId', requireProjectMember, getProjectTasks);
router.post('/project/:projectId', requireProjectMember, [
  body('title').trim().notEmpty().withMessage('Title required').isLength({ max: 200 }),
  body('status').optional().isIn(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']),
  body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
], createTask);

module.exports = router;
