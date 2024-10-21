const Group = require('../models/Group');

exports.getGroups = async (req, res) => {
  try {
    const groups = await Group.find({ members: req.user.userId });
    res.json(groups);
  } catch (error) {
    console.error('Error fetching groups:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createGroup = async (req, res) => {
  try {
    const { name } = req.body;
    const newGroup = new Group({
      name,
      members: [req.user.userId],
      admins: [req.user.userId]
    });
    await newGroup.save();
    res.status(201).json(newGroup);
  } catch (error) {
    console.error('Error creating group:', error);
    res.status(500).json({ message: 'Server error' });
  }
};