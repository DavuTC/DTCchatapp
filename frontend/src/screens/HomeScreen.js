import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { authService } from '../services/auth';
import { format } from 'date-fns';

export default function HomeScreen({ navigation }) {
  const [users, setUsers] = useState([]);
  const [directMessages, setDirectMessages] = useState([]);
  const [groups, setGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const unsubscribe = navigation.addListener('focus', fetchData);
    return unsubscribe;
  }, [navigation]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [fetchedUsers, fetchedMessages, fetchedGroups] = await Promise.all([
        authService.getUsers(),
        authService.getDirectMessages(),
        authService.getGroups()
      ]);
      setUsers(fetchedUsers);
      setDirectMessages(fetchedMessages);
      setGroups(fetchedGroups);
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to fetch data. Some features may be unavailable.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewMessage = () => {
    navigation.navigate('NewMessage', { users });
  };

  const handleNewGroup = () => {
    navigation.navigate('NewGroup');
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      navigation.replace('Login');
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Error', 'Failed to logout. Please try again.');
    }
  };

  const navigateToChat = (chatData) => {
    if (chatData.type === 'group') {
      navigation.navigate('ChatScreen', { 
        groupId: chatData.id,
        groupName: chatData.name,
        type: 'group'
      });
    } else {
      navigation.navigate('ChatScreen', { 
        userId: chatData.id,
        name: chatData.displayName,
        type: 'direct'
      });
    }
  };

  const renderGroupItem = ({ item }) => (
    <TouchableOpacity
      style={styles.chatItem}
      onPress={() => navigateToChat({ ...item, type: 'group' })}
    >
      <View style={styles.avatarContainer}>
        <Text style={styles.avatarText}>{item.name?.charAt(0)?.toUpperCase()}</Text>
      </View>
      <View style={styles.chatInfo}>
        <Text style={styles.chatName}>{item.name}</Text>
        <Text style={styles.lastMessage}>
          {item.lastMessage?.content || 'No messages yet'}
        </Text>
        {item.lastMessage?.createdAt && (
          <Text style={styles.timestamp}>
            {format(new Date(item.lastMessage.createdAt), 'HH:mm')}
          </Text>
        )}
        <Text style={styles.memberCount}>{item.members?.length || 0} members</Text>
      </View>
    </TouchableOpacity>
  );

  const renderDirectMessageItem = ({ item }) => (
    <TouchableOpacity
      style={styles.chatItem}
      onPress={() => navigateToChat({ ...item, type: 'direct' })}
    >
      <View style={styles.avatarContainer}>
        <Text style={styles.avatarText}>
          {item.displayName?.charAt(0)?.toUpperCase()}
        </Text>
      </View>
      <View style={styles.chatInfo}>
        <Text style={styles.chatName}>{item.displayName}</Text>
        <Text style={styles.lastMessage}>
          {item.lastMessage?.content || 'No messages yet'}
        </Text>
        {item.lastMessage?.createdAt && (
          <Text style={styles.timestamp}>
            {format(new Date(item.lastMessage.createdAt), 'HH:mm')}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={handleNewMessage}>
          <Text style={styles.headerButtonText}>New Message</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerButton} onPress={handleNewGroup}>
          <Text style={styles.headerButtonText}>New Group</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Groups</Text>
        <FlatList
          data={groups}
          renderItem={renderGroupItem}
          keyExtractor={(item) => `group-${item.id}`}
          ListEmptyComponent={() => (
            <Text style={styles.emptyText}>No groups yet</Text>
          )}
          style={styles.list}
        />

        <Text style={styles.sectionTitle}>Direct Messages</Text>
        <FlatList
          data={users}
          renderItem={renderDirectMessageItem}
          keyExtractor={(item) => `user-${item.id}`}
          ListEmptyComponent={() => (
            <Text style={styles.emptyText}>No messages yet</Text>
          )}
          style={styles.list}
        />
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F8F9FA',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerButton: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 5,
    elevation: 2,
  },
  headerButtonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#2C3E50',
  },
  list: {
    marginBottom: 20,
  },
  chatItem: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 10,
    marginBottom: 8,
    elevation: 1,
    alignItems: 'center',
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  chatInfo: {
    flex: 1,
  },
  chatName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#2C3E50',
  },
  lastMessage: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 2,
  },
  timestamp: {
    fontSize: 12,
    color: '#95A5A6',
    position: 'absolute',
    right: 0,
    top: 0,
  },
  memberCount: {
    fontSize: 12,
    color: '#95A5A6',
  },
  emptyText: {
    textAlign: 'center',
    color: '#95A5A6',
    fontStyle: 'italic',
    marginTop: 10,
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  logoutButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});