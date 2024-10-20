const jwt = require('jsonwebtoken');
const Message = require('../models/Message');

exports.setupSocketHandlers = (io) => {
  io.use((socket, next) => {
    if (socket.handshake.query && socket.handshake.query.token) {
      jwt.verify(socket.handshake.query.token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return next(new Error('Authentication error'));
        socket.decoded = decoded;
        next();
      });
    } else {
      next(new Error('Authentication error'));
    }
  }).on('connection', (socket) => {
    console.log('New client connected');

    socket.on('join group', (groupId) => {
      socket.join(groupId);
      console.log(`User ${socket.decoded.userId} joined group ${groupId}`);
    });

    socket.on('leave group', (groupId) => {
      socket.leave(groupId);
      console.log(`User ${socket.decoded.userId} left group ${groupId}`);
    });

    socket.on('send message', async (data) => {
      try {
        const { groupId, text } = data;
        const newMessage = new Message({
          group: groupId,
          sender: socket.decoded.userId,
          text
        });
        await newMessage.save();
        
        io.to(groupId).emit('new message', {
          message: newMessage,
          sender: { id: socket.decoded.userId }
        });
      } catch (error) {
        console.error('Error sending message:', error);
      }
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected');
    });
  });
};