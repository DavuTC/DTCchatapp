import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_URL = 'http://10.0.2.2:3000/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
});

api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const login = async (email, password) => {
  try {
    console.log('Sending login request to:', `${API_URL}/auth/login`);
    const response = await api.post('/auth/login', { email, password });
    console.log('Login response:', response.data);
    
    if (response.data && response.data.token) {
      await SecureStore.setItemAsync('token', response.data.token);
      // User bilgilerini de kaydet
      await SecureStore.setItemAsync('user', JSON.stringify(response.data.user));
      console.log('Token and user data saved');
      return response.data;
    } else {
      throw new Error('Token not found in response');
    }
  } catch (error) {
    console.error('Login error:', error.response ? error.response.data : error.message);
    throw error;
  }
};

export const register = async (email, password, displayName) => {
  try {
    console.log('Sending register request to:', `${API_URL}/auth/register`);
    const response = await api.post('/auth/register', { email, password, displayName });
    console.log('Register response:', response.data);
    
    if (response.data && response.data.token) {
      await SecureStore.setItemAsync('token', response.data.token);
      console.log('Token saved:', response.data.token);
      return response.data;
    } else {
      throw new Error('Token not found in response');
    }
  } catch (error) {
    console.error('Register error:', error.response ? error.response.data : error.message);
    throw error;
  }
};

export const logout = async () => {
  try {
    await SecureStore.deleteItemAsync('token');
    console.log('Token removed');
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
};

export const getGroups = async () => {
  try {
    console.log('Fetching groups...');
    const response = await api.get('/groups');
    console.log('Get groups response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Get groups error:', error.response ? error.response.data : error.message);
    throw error;
  }
};


export const createGroup = async (groupData) => {
  try {
    console.log('Creating group with data:', groupData);
    const response = await api.post('/groups', groupData);
    console.log('Create group response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Create group error:', error.response?.data || error);
    throw error;
  }
};

export const getUsers = async () => {
  try {
    console.log('Fetching users...');
    const response = await api.get('/users');
    console.log('Get users response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Get users error:', error.response ? error.response.data : error.message);
    throw error;
  }
};

export const getDirectMessages = async () => {
  try {
    console.log('Fetching direct messages...');
    const response = await api.get('/messages/direct');
    console.log('Get direct messages response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Get direct messages error:', error.response ? error.response.data : error.message);
    throw error;
  }
};

export const getGroupMessages = async (groupId) => {
  try {
    console.log('Fetching group messages for:', groupId);
    const response = await api.get(`/messages/group/${groupId}`);
    console.log('Group messages response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Get group messages error:', error.response?.data || error);
    throw error;
  }
};

export const sendMessage = async (messageData) => {
  try {
    console.log('Sending message:', messageData);
    const response = await api.post('/messages', messageData);
    console.log('Send message response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Send message error:', error.response ? error.response.data : error.message);
    throw error;
  }
};

export const authService = {
  login,
  register,
  logout,
  getGroups,
  createGroup,
  getUsers,
  getDirectMessages,
  getGroupMessages,
  sendMessage,
  createGroup
};

export default api;