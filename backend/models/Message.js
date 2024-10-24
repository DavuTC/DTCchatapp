const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Sender is required']
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
    required: [true, 'Message content is required'],
    trim: true
  },
  isDirect: {
    type: Boolean,
    default: true,
    required: true
  },
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: function() {
      return this.isDirect === false;
    }
  }
}, { 
  timestamps: true 
});

// Pre-save validation middleware
messageSchema.pre('save', async function(next) {
  try {
    console.log('Pre-save validation for message:', this.toObject());

    // Mesaj içeriği kontrolü
    if (!this.content || !this.content.trim()) {
      throw new Error('Message content cannot be empty');
    }

    // Direkt mesaj kontrolü
    if (this.isDirect && !this.recipient) {
      throw new Error('Recipient is required for direct messages');
    }

    // Grup mesajı kontrolü
    if (!this.isDirect && !this.group) {
      throw new Error('Group is required for group messages');
    }

    // Sender kontrolü
    if (!this.sender) {
      throw new Error('Sender is required');
    }

    next();
  } catch (error) {
    next(error);
  }
});

// Helper methods
messageSchema.methods = {
  isGroupMessage() {
    return !this.isDirect;
  },

  isSentBy(userId) {
    return this.sender.toString() === userId.toString();
  },

  isReceivedBy(userId) {
    if (this.isDirect) {
      return this.recipient.toString() === userId.toString();
    }
    return false;
  },

  // Yeni yardımcı metod
  toJSON() {
    const obj = this.toObject();
    if (obj.sender) obj.sender = obj.sender.toString();
    if (obj.recipient) obj.recipient = obj.recipient.toString();
    if (obj.group) obj.group = obj.group.toString();
    return obj;
  }
};

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;