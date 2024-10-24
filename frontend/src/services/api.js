import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_URL = 'http://10.0.2.2:3000/api';

const api = axios.create({
  baseURL: API_URL,
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
    const response = await api.post('/auth/login', { email, password });
    if (response.data && response.data.token) {
      await SecureStore.setItemAsync('token', response.data.token);
    }
    return response.data;
  } catch (error) {
    console.error('Login error:', error.response?.data || error.message);
    throw error;
  }
};

export const register = async (email, password, displayName) => {
  try {
    const response = await api.post('/auth/register', { email, password, displayName });
    if (response.data && response.data.token) {
      await SecureStore.setItemAsync('token', response.data.token);
    }
    return response.data;
  } catch (error) {
    console.error('Registration error:', error.response?.data || error.message);
    throw error;
  }
};

export const getUsers = async () => {
  try {
    const response = await api.get('/users');
    return response.data;
  } catch (error) {
    console.error('Get users error:', error.response?.data || error.message);
    throw error;
  }
};

export const sendMessage = async (recipientId, content, isDirect = true) => {
  try {
    const response = await api.post('/messages', { recipientId, content, isDirect });
    return response.data;
  } catch (error) {
    console.error('Send message error:', error.response?.data || error.message);
    throw error;
  }
};

export const getMessages = async (userId, isDirect = true) => {
  try {
    const response = await api.get(`/messages/${isDirect ? 'direct' : 'group'}/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Get messages error:', error.response?.data || error.message);
    throw error;
  }
};

export default api;