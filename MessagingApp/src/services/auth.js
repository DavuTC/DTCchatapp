import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_URL = 'http://10.0.2.2:3000/api';  // Bu URL'yi kendi backend adresinizle değiştirin

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

const login = async (email, password) => {
  try {
    console.log('Sending login request to:', `${API_URL}/auth/login`);
    const response = await api.post('/auth/login', { email, password });
    console.log('Login response:', response.data);

    let token;
    if (response.data && response.data.token) {
      token = response.data.token;
    } else if (response.data && response.data.data && response.data.data.token) {
      token = response.data.data.token;
    } else {
      console.error('Unexpected response structure:', response.data);
      throw new Error('Token not found in response');
    }

    await SecureStore.setItemAsync('token', token);
    console.log('Token saved:', token);
    return response.data;
  } catch (error) {
    console.error('Login error:', error.response ? error.response.data : error.message);
    throw error;
  }
};

const register = async (email, password, displayName) => {
  try {
    console.log('Sending register request to:', `${API_URL}/auth/register`);
    const response = await api.post('/auth/register', { email, password, displayName });
    console.log('Register response:', JSON.stringify(response.data, null, 2));
    
    let token, userData;
    if (response.data && response.data.token) {
      token = response.data.token;
      userData = response.data.user || response.data;
    } else if (response.data && response.data.data && response.data.data.token) {
      token = response.data.data.token;
      userData = response.data.data.user || response.data.data;
    } else {
      console.error('Unexpected response structure:', JSON.stringify(response.data, null, 2));
      throw new Error('Registration failed: Token not found in response');
    }

    if (!token) {
      throw new Error('Registration failed: Token not received');
    }

    await SecureStore.setItemAsync('token', token);
    console.log('Token saved successfully');
    return { token, user: userData };
  } catch (error) {
    console.error('Registration error:', error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
    if (error.response && error.response.status === 400 && error.response.data.message === 'User already exists') {
      throw new Error('User already exists');
    }
    throw error;
  }
};

const logout = async () => {
  try {
    await SecureStore.deleteItemAsync('token');
    console.log('Token removed');
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
};

const getGroups = async () => {
  try {
    const response = await api.get('/groups');
    console.log('Get groups response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Get groups error:', error.response ? error.response.data : error.message);
    throw error;
  }
};

const createGroup = async (groupName) => {
  try {
    const response = await api.post('/groups', { name: groupName });
    console.log('Create group response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Create group error:', error.response ? error.response.data : error.message);
    throw error;
  }
};



export const authService = {
  login,
  register,
  logout,
  getGroups,
  createGroup
  
};

export default api;