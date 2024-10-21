const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Message = require('../models/Message');
const User = require('../models/User');
const mongoose = require('mongoose');

// Send a message
router.post('/', auth, async (req, res) => {
  try {
    const { recipientId, content, isDirect } = req.body;

    if (!recipientId || !content) {
      return res.status(400).json({ message: 'RecipientId and content are required' });
    }

    let recipient;
    if (recipientId.startsWith('temp_')) {
      // Handle temporary user
      recipient = await User.findOne({ tempId: recipientId });
      if (!recipient) {
        return res.status(404).json({ message: 'Recipient not found' });
      }
    } else {
      // Check if recipientId is a valid ObjectId
      if (!mongoose.Types.ObjectId.isValid(recipientId)) {
        return res.status(400).json({ message: 'Invalid recipient ID' });
      }
      recipient = await User.findById(recipientId);
      if (!recipient) {
        return res.status(404).json({ message: 'Recipient not found' });
      }
    }

    const newMessage = new Message({
      sender: req.user.userId,
      recipient: recipient._id,
      content,
      isDirect: isDirect || true
    });

    await newMessage.save();
    res.status(201).json(newMessage);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get messages
router.get('/:type/:id', auth, async (req, res) => {
  try {
    const { type, id } = req.params;

    let recipient;
    if (id.startsWith('temp_')) {
      recipient = await User.findOne({ tempId: id });
    } else if (mongoose.Types.ObjectId.isValid(id)) {
      recipient = await User.findById(id);
    }

    if (!recipient) {
      return res.status(404).json({ message: 'Recipient not found' });
    }

    let messages;
    if (type === 'direct') {
      messages = await Message.find({
        $or: [
          { sender: req.user.userId, recipient: recipient._id, isDirect: true },
          { sender: recipient._id, recipient: req.user.userId, isDirect: true }
        ]
      }).sort({ createdAt: -1 });
    } else {
      return res.status(400).json({ message: 'Invalid message type' });
    }

    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;