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
    await SecureStore.deleteItemAsync('user');
    console.log('Token and user data removed');
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
};

export const getCurrentUser = async () => {
  try {
    const userJson = await SecureStore.getItemAsync('user');
    if (userJson) {
      return JSON.parse(userJson);
    }
    // Eğer local storage'da user yoksa API'den al
    const response = await api.get('/users/me');
    await SecureStore.setItemAsync('user', JSON.stringify(response.data));
    return response.data;
  } catch (error) {
    console.error('Get current user error:', error.response?.data || error);
    throw error;
  }
};

export const deleteAccount = async () => {
  try {
    console.log('Deleting account...');
    const response = await api.delete('/users/me');
    console.log('Account deleted successfully');
    
    // Kullanıcı verilerini temizle
    await SecureStore.deleteItemAsync('token');
    await SecureStore.deleteItemAsync('user');
    
    return response.data;
  } catch (error) {
    console.error('Delete account error:', error.response?.data || error);
    throw error;
  }
};

export const updateProfile = async (userData) => {
  try {
    console.log('Updating profile with data:', userData);
    const response = await api.put('/users/me', userData);
    
    // Güncellenmiş kullanıcı bilgilerini kaydet
    await SecureStore.setItemAsync('user', JSON.stringify(response.data));
    console.log('Profile updated successfully:', response.data);
    
    return response.data;
  } catch (error) {
    console.error('Update profile error:', error.response?.data || error);
    throw error;
  }
};

export const getGroups = async () => {
  try {
    console.log('Fetching groups...');
    const response = await api.get('/groups');
    console.log('Groups response:', response.data);
    
    // Yanıtı kontrol et ve formatlı veriyi döndür
    if (Array.isArray(response.data)) {
      const formattedGroups = response.data.map(group => ({
        _id: group._id || group.id,
        id: group._id || group.id,
        name: group.name,
        members: Array.isArray(group.members) ? group.members : []
      }));
      return formattedGroups;
    }
    return [];
  } catch (error) {
    console.error('Get groups error:', error.response?.data || error);
    return [];
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
      console.log('Preparing message data:', messageData);
      
      // Mesaj tipine göre payload hazırla
      const payload = {
          content: messageData.content,
          type: messageData.type,
          isDirect: messageData.type === 'direct'
      };

      // Mesaj tipine göre ek bilgileri ekle
      if (messageData.type === 'direct') {
          payload.recipientId = messageData.receiver || messageData.recipientId;
      } else if (messageData.type === 'group') {
          payload.groupId = messageData.groupId;
      }

      console.log('Sending payload:', payload);
      const response = await api.post('/messages', payload);
      console.log('Message sent successfully:', response.data);
      return response.data;
  } catch (error) {
      console.error('Send message error:', error.response?.data || error);
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
  createGroup,
  getCurrentUser,
  deleteAccount,
  updateProfile
};

export default api;