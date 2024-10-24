import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  TextInput
} from 'react-native';
import { Checkbox, Button } from 'react-native-paper';
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
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const initializeScreen = async () => {
      try {
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
        members: [...selectedUsers, currentUser.id],
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
      Alert.alert('Error', 'Failed to create group. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <View style={styles.headerContainer}>
          <TextInput
            style={styles.groupNameInput}
            placeholder="Enter group name"
            value={groupName}
            onChangeText={setGroupName}
            placeholderTextColor="#666"
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search users..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#666"
          />
        </View>

        <Text style={styles.subtitle}>Select Members ({selectedUsers.length} selected)</Text>

        <ScrollView style={styles.userList}>
          {filteredUsers.map(user => (
            <TouchableOpacity
              key={user.id}
              style={[
                styles.userItem,
                selectedUsers.includes(user.id) && styles.selectedUserItem
              ]}
              onPress={() => toggleUserSelection(user.id)}
            >
              <View style={styles.avatarContainer}>
                <Text style={styles.avatarText}>
                  {user.displayName.charAt(0).toUpperCase()}
                </Text>
              </View>
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
          {filteredUsers.length === 0 && (
            <Text style={styles.noUsersText}>No users found</Text>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <Button
            mode="contained"
            onPress={createGroup}
            loading={creating}
            disabled={creating || selectedUsers.length < 2 || !groupName.trim()}
            style={[
              styles.createButton,
              (creating || selectedUsers.length < 2 || !groupName.trim()) && 
              styles.disabledButton
            ]}
            labelStyle={styles.createButtonLabel}
          >
            Create Group ({selectedUsers.length} members)
          </Button>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA'
  },
  keyboardAvoidingView: {
    flex: 1
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  headerContainer: {
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF'
  },
  groupNameInput: {
    height: 48,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#DEE2E6'
  },
  searchInput: {
    height: 40,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#DEE2E6'
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    margin: 16,
    color: '#2C3E50'
  },
  userList: {
    flex: 1,
    paddingHorizontal: 16
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2
  },
  selectedUserItem: {
    backgroundColor: '#E3F2FD',
    borderWidth: 1,
    borderColor: '#2196F3'
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  avatarText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold'
  },
  userInfo: {
    flex: 1,
    marginRight: 12
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2C3E50',
    marginBottom: 4
  },
  userEmail: {
    fontSize: 14,
    color: '#7F8C8D'
  },
  noUsersText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#7F8C8D',
    fontStyle: 'italic'
  },
  footer: {
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF'
  },
  createButton: {
    height: 48,
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 8,
    elevation: 2
  },
  disabledButton: {
    backgroundColor: '#CED4DA'
  },
  createButtonLabel: {
    fontSize: 16,
    fontWeight: 'bold'
  }
});

export default NewGroupScreen;