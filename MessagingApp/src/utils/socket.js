// src/services/socket.js
import io from 'socket.io-client';
import * as SecureStore from 'expo-secure-store';

let socket;

export const initSocket = async () => {
  const token = await SecureStore.getItemAsync('token');
  
  socket = io('http://10.0.2.2:3000/api', {
    auth: {
      token: token
    }
  });

  socket.on('connect', () => {
    console.log('Connected to socket server');
  });

  socket.on('disconnect', () => {
    console.log('Disconnected from socket server');
  });

  return socket;
};

export const getSocket = () => {
  if (!socket) {
    throw new Error('Socket is not initialized. Call initSocket first.');
  }
  return socket;
};

export const joinGroup = (groupId) => {
  if (socket) {
    socket.emit('join group', groupId);
  }
};

export const leaveGroup = (groupId) => {
  if (socket) {
    socket.emit('leave group', groupId);
  }
};

export const sendMessage = (groupId, content) => {
  if (socket) {
    socket.emit('send message', { groupId, content });
  }
};