const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Message = require('../models/Message');
const Group = require('../models/Group');

// Get direct messages with a specific user
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
    console.error('Get direct messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

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
    // Önce kullanıcının grup üyesi olup olmadığını kontrol et
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
    .sort({ createdAt: -1 });

    res.json(messages);
  } catch (error) {
    console.error('Get group messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Send message (handles both direct and group messages)
router.post('/', auth, async (req, res) => {
  try {
    const { recipientId, groupId, content, isDirect = true } = req.body;

    // Mesaj içeriği kontrolü
    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Message content is required' });
    }

    // Grup mesajı veya direkt mesaj kontrolü
    if (!isDirect && !groupId) {
      return res.status(400).json({ message: 'Group ID is required for group messages' });
    }

    if (isDirect && !recipientId) {
      return res.status(400).json({ message: 'Recipient ID is required for direct messages' });
    }

    // Grup mesajı için grup üyeliği kontrolü
    if (!isDirect) {
      const group = await Group.findOne({
        _id: groupId,
        members: req.user.userId
      });

      if (!group) {
        return res.status(403).json({ message: 'Not a member of this group' });
      }
    }

    const newMessage = new Message({
      sender: req.user.userId,
      content,
      isDirect,
      ...(isDirect ? { recipient: recipientId } : { group: groupId }),
      createdAt: new Date()
    });

    await newMessage.save();

    const populatedMessage = await Message.findById(newMessage._id)
      .populate('sender', 'displayName email')
      .populate('recipient', 'displayName email');

    // Grup mesajı ise grubun son mesajını güncelle
    if (!isDirect) {
      await Group.findByIdAndUpdate(groupId, {
        lastMessage: newMessage._id
      });
    }

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get recent messages (both direct and group)
router.get('/recent', auth, async (req, res) => {
  try {
    // Direkt mesajları al
    const directMessages = await Message.find({
      $or: [
        { sender: req.user.userId },
        { recipient: req.user.userId }
      ],
      isDirect: true
    })
    .populate('sender', 'displayName email')
    .populate('recipient', 'displayName email')
    .sort({ createdAt: -1 })
    .limit(20);

    // Kullanıcının üye olduğu grupları al
    const userGroups = await Group.find({
      members: req.user.userId
    });

    // Grup mesajlarını al
    const groupMessages = await Message.find({
      group: { $in: userGroups.map(g => g._id) },
      isDirect: false
    })
    .populate('sender', 'displayName email')
    .populate('group', 'name')
    .sort({ createdAt: -1 })
    .limit(20);

    res.json({
      directMessages,
      groupMessages
    });
  } catch (error) {
    console.error('Error fetching recent messages:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;