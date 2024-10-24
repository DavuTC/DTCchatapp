const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Message = require('../models/Message');
const Group = require('../models/Group');

// Get all direct messages
router.get('/direct', auth, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { sender: req.user.userId },
        { recipient: req.user.userId }
      ],
      isDirect: true
    })
    .populate('sender', 'displayName email')
    .populate('recipient', 'displayName email')
    .sort({ createdAt: -1 });

    res.json(messages);
  } catch (error) {
    console.error('Error fetching direct messages:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get group messages
router.get('/group/:groupId', auth, async (req, res) => {
  try {
    // Grup üyeliği kontrolü
    const group = await Group.findOne({
      _id: req.params.groupId,
      members: req.user.userId
    });

    if (!group) {
      return res.status(403).json({ message: 'Not a member of this group' });
    }

    const messages = await Message.find({
      group: req.params.groupId,
      isDirect: false
    })
    .populate('sender', 'displayName email')
    .populate('group', 'name')
    .sort({ createdAt: -1 });

    res.json(messages);
  } catch (error) {
    console.error('Error fetching group messages:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Send message (handles both direct and group messages)
router.post('/', auth, async (req, res) => {
  try {
    const { content, recipientId, groupId, type } = req.body;

    // Mesaj içeriği kontrolü
    if (!content?.trim()) {
      return res.status(400).json({ message: 'Message content is required' });
    }

    const messageData = {
      sender: req.user.userId,
      content: content.trim(),
      isDirect: type !== 'group'
    };

    // Grup mesajı için
    if (type === 'group') {
      if (!groupId) {
        return res.status(400).json({ message: 'Group ID is required for group messages' });
      }

      // Grup üyeliği kontrolü
      const group = await Group.findOne({
        _id: groupId,
        members: req.user.userId
      });

      if (!group) {
        return res.status(403).json({ message: 'Not a member of this group' });
      }

      messageData.group = groupId;
    } 
    // Direkt mesaj için
    else {
      if (!recipientId) {
        return res.status(400).json({ message: 'Recipient ID is required for direct messages' });
      }
      messageData.recipient = recipientId;
    }

    const newMessage = new Message(messageData);
    await newMessage.save();

    const populatedMessage = await Message.findById(newMessage._id)
      .populate('sender', 'displayName email')
      .populate('recipient', 'displayName email')
      .populate('group', 'name');

    // Grup mesajı için son mesajı güncelle
    if (type === 'group') {
      await Group.findByIdAndUpdate(groupId, {
        lastMessage: newMessage._id
      });
    }

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ 
      message: error.message || 'Server error' 
    });
  }
});

// Get direct messages with specific user
router.get('/direct/:userId', auth, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { sender: req.user.userId, recipient: req.params.userId },
        { sender: req.params.userId, recipient: req.user.userId }
      ],
      isDirect: true
    })
    .populate('sender', 'displayName email')
    .populate('recipient', 'displayName email')
    .sort({ createdAt: -1 });

    res.json(messages);
  } catch (error) {
    console.error('Error fetching direct messages:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;