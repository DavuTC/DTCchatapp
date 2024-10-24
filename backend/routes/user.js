const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

// Get all users
router.get('/', auth, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    const usersWithStringId = users.map(user => ({
      ...user.toObject(),
      id: user._id.toString()
    }));
    res.json(usersWithStringId);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    console.log('Finding user with ID:', req.user.id);
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      console.log('User not found for ID:', req.user.id);
      return res.status(404).json({ message: 'User not found' });
    }
    
    const userWithStringId = {
      ...user.toObject(),
      id: user._id.toString()
    };
    
    res.json(userWithStringId);
  } catch (error) {
    console.error('Error fetching current user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update current user
router.put('/me', auth, async (req, res) => {
  try {
    const { displayName } = req.body;
    const updateData = {};

    if (displayName) {
      updateData.displayName = displayName;
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateData },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userWithStringId = {
      ...user.toObject(),
      id: user._id.toString()
    };

    res.json(userWithStringId);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete current user
router.delete('/me', auth, async (req, res) => {
  try {
    console.log('Attempting to delete user. User ID from token:', req.user.id);
    
    // Önce kullanıcıyı bulmaya çalış
    const user = await User.findById(req.user.id);
    
    console.log('Found user:', user); // Debug için

    if (!user) {
      console.log('User not found for deletion');
      return res.status(404).json({ message: 'User not found' });
    }

    // findOneAndDelete kullan
    const deletedUser = await User.findOneAndDelete({ _id: req.user.id });
    
    console.log('Deleted user result:', deletedUser); // Debug için

    if (!deletedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ 
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    
    // Daha detaylı hata mesajı
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;