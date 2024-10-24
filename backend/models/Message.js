const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() {
      return this.isDirect === true;
    }
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  isDirect: {
    type: Boolean,
    default: true
  },
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: function() {
      return this.isDirect === false;
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Validation middleware
messageSchema.pre('save', function(next) {
  // Direkt mesaj kontrolü
  if (this.isDirect && !this.recipient) {
    this.invalidate('recipient', 'Recipient is required for direct messages');
  }

  // Grup mesajı kontrolü
  if (!this.isDirect && !this.group) {
    this.invalidate('group', 'Group is required for group messages');
  }

  // Mesaj içeriği kontrolü
  if (!this.content || !this.content.trim()) {
    const err = new Error('Message content cannot be empty');
    return next(err);
  }

  next();
});

// Helper methods
messageSchema.methods = {
  // Mesaj tipini kontrol et
  isGroupMessage() {
    return !this.isDirect;
  },

  // Gönderen kontrolü
  isSentBy(userId) {
    return this.sender.toString() === userId.toString();
  },

  // Alıcı kontrolü
  isReceivedBy(userId) {
    if (this.isDirect) {
      return this.recipient.toString() === userId.toString();
    }
    return false;
  }
};

module.exports = mongoose.model('Message', messageSchema);