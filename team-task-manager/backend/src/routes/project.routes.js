const express = require('express');
const { body } = require('express-validator');
const {
  getProjects, getProject, createProject, updateProject, deleteProject,
  addMember, updateMemberRole, removeMember,
} = require('../controllers/project.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireProjectAdmin, requireProjectMember } = require('../middleware/role.middleware');

const router = express.Router();
router.use(authenticate);

router.get('/', getProjects);
router.post('/', [
  body('name').trim().notEmpty().withMessage('Project name required').isLength({ max: 100 }),
  body('description').optional().isLength({ max: 500 }),
], createProject);

router.get('/:projectId', requireProjectMember, getProject);
router.patch('/:projectId', requireProjectAdmin, [
  body('name').optional().trim().notEmpty().isLength({ max: 100 }),
], updateProject);
router.delete('/:projectId', requireProjectAdmin, deleteProject);

// Members
router.post('/:projectId/members', requireProjectAdmin, [
  body('email').isEmail().normalizeEmail(),
  body('role').optional().isIn(['ADMIN', 'MEMBER']),
], addMember);
router.patch('/:projectId/members/:memberId', requireProjectAdmin, [
  body('role').isIn(['ADMIN', 'MEMBER']),
], updateMemberRole);
router.delete('/:projectId/members/:memberId', requireProjectAdmin, removeMember);

module.exports = router;
