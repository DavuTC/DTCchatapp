const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Group = require('../models/Group');

router.get('/', auth, async (req, res) => {
  try {
    console.log('Fetching groups for user:', req.user); // Debugging line
    const groups = await Group.find({ members: req.user });
    console.log('Groups found:', groups.length); // Debugging line
    
    if (groups.length === 0) {
      console.log('No groups found for user');
      return res.json([]);
    }
    
    res.json(groups);
  } catch (error) {
    console.error('Error fetching groups:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Group name is required' });
    }

    const newGroup = new Group({
      name,
      members: [req.user],
      createdBy: req.user
    });

    await newGroup.save();
    console.log('New group created:', newGroup);
    res.status(201).json(newGroup);
  } catch (error) {
    console.error('Error creating group:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Other group-related routes...

module.exports = router;