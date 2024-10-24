const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Group = require('../models/Group');

// Debug middleware
router.use((req, res, next) => {
  console.log('Group route accessed:', {
    method: req.method,
    url: req.url,
    body: req.body
  });
  next();
});

// Get all groups
router.get('/', auth, async (req, res) => {
  try {
    const groups = await Group.find({
      $or: [
        { members: req.user.userId },
        { admins: req.user.userId }
      ]
    })
    .populate('members', 'displayName email')
    .populate('admins', 'displayName email');

    res.json(groups);
  } catch (error) {
    console.error('Get groups error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new group
router.post('/', auth, async (req, res) => {
  try {
    console.log('Creating group with data:', req.body);
    const { name, members, admin } = req.body;

    if (!name || !members || members.length < 2) {
      return res.status(400).json({ 
        message: 'Name and at least 2 members are required' 
      });
    }

    const newGroup = new Group({
      name,
      members,
      admins: [admin],
      createdAt: new Date()
    });

    await newGroup.save();
    console.log('Group created:', newGroup);

    const populatedGroup = await Group.findById(newGroup._id)
      .populate('members', 'displayName email')
      .populate('admins', 'displayName email');

    res.status(201).json(populatedGroup);
  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;