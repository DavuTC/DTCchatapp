const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Message = require('../models/Message');
const Group = require('../models/Group');

// Get all direct messages
router.get('/direct', auth, async (req, res) => {
  try {
    console.log('Fetching direct messages for user:', req.user.id);
    const messages = await Message.find({
      $or: [
        { sender: req.user.id },
        { recipient: req.user.id }
      ],
      isDirect: true
    })
    .populate('sender', 'displayName email')
    .populate('recipient', 'displayName email')
    .sort({ createdAt: -1 });

    console.log('Found direct messages:', messages.length);
    res.json(messages);
  } catch (error) {
    console.error('Error fetching direct messages:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get group messages
router.get('/group/:groupId', auth, async (req, res) => {
  try {
    console.log('Fetching messages for group:', req.params.groupId);
    console.log('User ID:', req.user.id);

    // Grup üyeliği kontrolü
    const group = await Group.findOne({
      _id: req.params.groupId,
      members: req.user.id
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

    console.log('Found group messages:', messages.length);
    res.json(messages);
  } catch (error) {
    console.error('Error fetching group messages:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Send message
router.post('/', auth, async (req, res) => {
  try {
    console.log('Received message request:', {
      body: req.body,
      user: req.user.id
    });

    const { content, recipientId, groupId, type } = req.body;

    // Mesaj içeriği kontrolü
    if (!content?.trim()) {
      return res.status(400).json({ message: 'Message content is required' });
    }

    // Mesaj verisi hazırlama
    const messageData = {
      sender: req.user.id,
      content: content.trim(),
      isDirect: type !== 'group'
    };

    // Grup mesajı kontrolü ve işleme
    if (type === 'group') {
      if (!groupId) {
        return res.status(400).json({ message: 'Group ID is required for group messages' });
      }

      const group = await Group.findOne({
        _id: groupId,
        members: req.user.id
      });

      if (!group) {
        return res.status(403).json({ message: 'Not a member of this group' });
      }

      messageData.group = groupId;
      messageData.isDirect = false;
    } 
    // Direkt mesaj kontrolü ve işleme
    else {
      if (!recipientId) {
        return res.status(400).json({ message: 'Recipient ID is required for direct messages' });
      }
      messageData.recipient = recipientId;
      messageData.isDirect = true;
    }

    console.log('Creating message with data:', messageData);

    // Mesaj oluşturma ve kaydetme
    const newMessage = new Message(messageData);
    await newMessage.save();

    // Populate edilmiş mesajı getir
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

    console.log('Message saved successfully:', populatedMessage);
    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ 
      message: error.message || 'Server error',
      details: error.toString()
    });
  }
});

// Get direct messages with specific user
router.get('/direct/:userId', auth, async (req, res) => {
  try {
    console.log('Fetching direct messages with user:', req.params.userId);
    const messages = await Message.find({
      $or: [
        { sender: req.user.id, recipient: req.params.userId },
        { sender: req.params.userId, recipient: req.user.id }
      ],
      isDirect: true
    })
    .populate('sender', 'displayName email')
    .populate('recipient', 'displayName email')
    .sort({ createdAt: -1 });

    console.log('Found messages:', messages.length);
    res.json(messages);
  } catch (error) {
    console.error('Error fetching direct messages:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;