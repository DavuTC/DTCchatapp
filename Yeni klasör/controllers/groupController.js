const Group = require('../models/Group');

exports.createGroup = async (req, res) => {
  try {
    const { name, groupImage } = req.body;
    const newGroup = new Group({
      name,
      groupImage,
      members: [req.user.userId],
      admins: [req.user.userId]
    });

    await newGroup.save();
    res.status(201).json(newGroup);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getGroups = async (req, res) => {
  try {
    const groups = await Group.find({ members: req.user.userId });
    res.json(groups);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getGroupDetails = async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId).populate('members', 'displayName email');
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }
    res.json(group);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};