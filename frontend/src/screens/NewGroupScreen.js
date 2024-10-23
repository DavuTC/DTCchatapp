import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert
} from 'react-native';
import { TextInput, Checkbox, Button } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import { authService } from '../services/auth';

const NewGroupScreen = () => {
  const navigation = useNavigation();
  const [groupName, setGroupName] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const initializeScreen = async () => {
      try {
        // Mevcut kullanıcı bilgisini al
        const userString = await SecureStore.getItemAsync('user');
        if (userString) {
          const userData = JSON.parse(userString);
          setCurrentUser(userData);
        }
        await fetchUsers();
      } catch (error) {
        console.error('Initialization error:', error);
        Alert.alert('Error', 'Failed to initialize screen');
      }
    };

    initializeScreen();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const fetchedUsers = await authService.getUsers();
      const userString = await SecureStore.getItemAsync('user');
      const currentUser = userString ? JSON.parse(userString) : null;
      
      // Mevcut kullanıcıyı listeden çıkar
      const filteredUsers = currentUser 
        ? fetchedUsers.filter(user => user.id !== currentUser.id)
        : fetchedUsers;
      
      setUsers(filteredUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      Alert.alert('Error', 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const toggleUserSelection = useCallback((userId) => {
    setSelectedUsers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  }, []);

  const createGroup = async () => {
    if (!currentUser) {
      Alert.alert('Error', 'User data not found. Please login again.');
      return;
    }

    if (!groupName.trim()) {
      Alert.alert('Error', 'Please enter a group name');
      return;
    }

    if (selectedUsers.length < 2) {
      Alert.alert('Error', 'Please select at least 2 members');
      return;
    }

    try {
      setCreating(true);
      
      const groupData = {
        name: groupName.trim(),
        members: [...selectedUsers, currentUser.id], // Mevcut kullanıcıyı da ekle
        admin: currentUser.id
      };

      console.log('Creating group with data:', groupData);
      await authService.createGroup(groupData);

      Alert.alert(
        'Success',
        'Group created successfully',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Error creating group:', error);
      Alert.alert(
        'Error',
        'Failed to create group. Please try again.'
      );
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TextInput
        mode="outlined"
        label="Group Name"
        value={groupName}
        onChangeText={setGroupName}
        style={styles.input}
        placeholder="Enter group name"
      />

      <Text style={styles.subtitle}>Select Members:</Text>

      <ScrollView style={styles.userList}>
        {users.map(user => (
          <TouchableOpacity
            key={user.id}
            style={styles.userItem}
            onPress={() => toggleUserSelection(user.id)}
          >
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user.displayName}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>
            </View>
            <Checkbox
              status={selectedUsers.includes(user.id) ? 'checked' : 'unchecked'}
              onPress={() => toggleUserSelection(user.id)}
              color="#007AFF"
            />
          </TouchableOpacity>
        ))}
        {users.length === 0 && (
          <Text style={styles.noUsersText}>No users available</Text>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.selectedCount}>
          Selected: {selectedUsers.length} members
        </Text>
        <Button
          mode="contained"
          onPress={createGroup}
          loading={creating}
          disabled={creating || selectedUsers.length < 2 || !groupName.trim()}
          style={styles.createButton}
        >
          Create Group
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#fff'
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333'
  },
  userList: {
    flex: 1,
    marginBottom: 16
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  userInfo: {
    flex: 1,
    marginRight: 8
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2
  },
  userEmail: {
    fontSize: 14,
    color: '#666'
  },
  noUsersText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#666',
    fontStyle: 'italic'
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff'
  },
  selectedCount: {
    textAlign: 'center',
    marginBottom: 8,
    color: '#666'
  },
  createButton: {
    paddingVertical: 8,
    backgroundColor: '#007AFF'
  }
});

export default NewGroupScreen;