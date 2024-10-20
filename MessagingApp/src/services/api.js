import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_URL = 'http://10.0.2.2:3000/api';  // Backend IP adresinizi buraya yazın

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const login = async (email, password) => {
  try {
    console.log('Making login request to:', `${API_URL}/auth/login`);
    const response = await api.post('/auth/login', { email, password });
    console.log('API Response:', response);
    if (response.data && response.data.success) {
      await SecureStore.setItemAsync('token', response.data.data.token);
      return response.data.data;
    } else {
      throw new Error(response.data.message || 'Login failed');
    }
  } catch (error) {
    console.error('Login error:', error);
    if (error.response) {
      console.log('Error Response:', error.response);
      console.log('Error Response Data:', error.response.data);
      console.log('Error Response Status:', error.response.status);
      console.log('Error Response Headers:', error.response.headers);
    } else if (error.request) {
      console.log('Error Request:', error.request);
    } else {
      console.log('Error Message:', error.message);
    }
    throw error.response?.data || error;
  }
};

export const register = async (email, password, displayName) => {
  try {
    const response = await api.post('/auth/register', { email, password, displayName });
    if (response.data && response.data.success) {
      await SecureStore.setItemAsync('token', response.data.data.token);
      return response.data.data;
    } else {
      throw new Error(response.data.message || 'Registration failed');
    }
  } catch (error) {
    console.error('Registration error:', error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

export const getGroups = async () => {
  try {
    const response = await api.get('/groups');
    return response.data;
  } catch (error) {
    console.error('Get groups error:', error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

export const getMessages = async (groupId) => {
  try {
    const response = await api.get(`/messages/${groupId}`);
    return response.data;
  } catch (error) {
    console.error('Get messages error:', error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

export const sendMessage = async (groupId, content) => {
  try {
    const response = await api.post('/messages', { groupId, content });
    return response.data;
  } catch (error) {
    console.error('Send message error:', error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

export default api;