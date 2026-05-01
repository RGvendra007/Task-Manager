const express = require('express');
const { searchUsers } = require('../controllers/user.controller');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();
router.use(authenticate);
router.get('/search', searchUsers);
module.exports = router;
