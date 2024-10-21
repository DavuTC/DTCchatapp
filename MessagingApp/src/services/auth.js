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
      console.log('Token saved:', response.data.token);
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
    const response = await api.get('/groups');
    console.log('Get groups response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Get groups error:', error.response ? error.response.data : error.message);
    throw error;
  }
};

export const createGroup = async (groupName) => {
  try {
    const response = await api.post('/groups', { name: groupName });
    console.log('Create group response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Create group error:', error.response ? error.response.data : error.message);
    throw error;
  }
};

export const getUsers = async () => {
  try {
    // Temporary solution until the backend endpoint is created
    console.log('Get users request - This endpoint is not yet implemented on the backend');
    return [
      { id: '1', displayName: 'User 1' },
      { id: '2', displayName: 'User 2' },
      { id: '3', displayName: 'User 3' },
    ];
  } catch (error) {
    console.error('Get users error:', error.response ? error.response.data : error.message);
    throw error;
  }
};

export const getDirectMessages = async () => {
  try {
    // Temporary solution until the backend endpoint is created
    console.log('Get direct messages request - This endpoint is not yet implemented on the backend');
    return [];
  } catch (error) {
    console.error('Get direct messages error:', error.response ? error.response.data : error.message);
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
  getDirectMessages
};

export default api;