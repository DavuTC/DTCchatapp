const Message = require('../models/Message');

exports.getMessages = async (req, res) => {
  try {
    const messages = await Message.find({ group: req.params.groupId })
      .sort('-createdAt')
      .limit(50)
      .populate('sender', 'displayName');
    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { groupId, text } = req.body;
    const newMessage = new Message({
      group: groupId,
      sender: req.user.userId,
      text
    });

    await newMessage.save();
    res.status(201).json(newMessage);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};