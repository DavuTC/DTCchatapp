const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const groupController = require('../controllers/groupController');

router.get('/', auth, groupController.getGroups);
router.post('/', auth, groupController.createGroup);

module.exports = router;