const express = require('express');
const router = express.Router();
const Group = require('../models/Group');
const auth = require('../middleware/auth');

// Tüm grupları getir
router.get('/', auth, async (req, res) => {
  try {
    console.log('Getting groups for user:', req.user.id);
    
    const groups = await Group.find({
      members: req.user.id
    }).populate('members', 'displayName email');

    console.log('Found groups:', groups);

    const formattedGroups = groups.map(group => ({
      _id: group._id.toString(),
      id: group._id.toString(),
      name: group.name,
      members: group.members.map(member => ({
        _id: member._id.toString(),
        id: member._id.toString(),
        displayName: member.displayName,
        email: member.email
      }))
    }));

    console.log('Sending formatted groups:', formattedGroups);
    res.json(formattedGroups);
  } catch (error) {
    console.error('Error getting groups:', error);
    res.status(500).json({ message: 'Server error while fetching groups' });
  }
});

// Yeni grup oluştur
router.post('/', auth, async (req, res) => {
  try {
    const { name, members } = req.body;
    console.log('Creating group:', { name, members });

    if (!name || !members) {
      return res.status(400).json({ message: 'Name and members are required' });
    }

    // Oluşturan kişiyi otomatik ekle
    const allMembers = [...new Set([...members, req.user.id])];

    const newGroup = new Group({
      name: name.trim(),
      members: allMembers,
      creator: req.user.id
    });

    await newGroup.save();

    const populatedGroup = await Group.findById(newGroup._id)
      .populate('members', 'displayName email');

    const formattedGroup = {
      _id: populatedGroup._id.toString(),
      id: populatedGroup._id.toString(),
      name: populatedGroup.name,
      members: populatedGroup.members.map(member => ({
        _id: member._id.toString(),
        id: member._id.toString(),
        displayName: member.displayName,
        email: member.email
      }))
    };

    console.log('Created group:', formattedGroup);
    res.status(201).json(formattedGroup);
  } catch (error) {
    console.error('Error creating group:', error);
    res.status(500).json({ message: 'Server error while creating group' });
  }
});

module.exports = router;