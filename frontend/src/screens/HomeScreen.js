import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { authService } from '../services/auth';

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

  const handleProfile = () => {
    navigation.navigate('Profile');
  };

  const navigateToChat = (chatData) => {
    if (chatData.type === 'group') {
      navigation.navigate('ChatScreen', {
        groupId: chatData._id,
        groupName: chatData.name,
        type: 'group'
      });
    } else {
      navigation.navigate('ChatScreen', {
        userId: chatData._id,
        name: chatData.displayName,
        type: 'direct'
      });
    }
  };

  const renderUserItem = ({ item }) => (
    <TouchableOpacity
      style={styles.userItem}
      onPress={() => navigateToChat({
        _id: item._id,
        displayName: item.displayName,
        type: 'direct'
      })}
    >
      <View style={styles.userInfo}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {item.displayName?.charAt(0)?.toUpperCase() || '?'}
          </Text>
        </View>
        <View style={styles.userDetails}>
          <Text style={styles.userName}>{item.displayName}</Text>
          <Text style={styles.userEmail}>{item.email}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderGroupItem = ({ item }) => (
    <TouchableOpacity
      style={styles.userItem}
      onPress={() => navigateToChat({
        _id: item._id,
        name: item.name,
        type: 'group'
      })}
    >
      <View style={styles.userInfo}>
        <View style={[styles.avatarContainer, styles.groupAvatar]}>
          <Text style={styles.avatarText}>
            {item.name?.charAt(0)?.toUpperCase() || 'G'}
          </Text>
        </View>
        <View style={styles.userDetails}>
          <Text style={styles.userName}>{item.name}</Text>
          <Text style={styles.userEmail}>{item.members?.length || 0} members</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
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

      {/* Groups Section */}
      <Text style={styles.sectionTitle}>Groups</Text>
      <FlatList
        data={groups}
        renderItem={renderGroupItem}
        keyExtractor={(item) => `group-${item._id}`}
        ListEmptyComponent={() => (
          <Text style={styles.noDataText}>No groups yet</Text>
        )}
        style={styles.list}
      />
      
      {/* Direct Messages Section */}
      <Text style={styles.sectionTitle}>Direct Messages</Text>
      <FlatList
        data={users}
        renderItem={renderUserItem}
        keyExtractor={(item) => `user-${item._id}`}
        ListEmptyComponent={() => (
          <Text style={styles.noDataText}>No users found</Text>
        )}
        style={styles.list}
      />
      
      <View style={styles.bottomButtonsContainer}>
        <TouchableOpacity style={styles.profileButton} onPress={handleProfile}>
          <Text style={styles.profileButtonText}>Account Settings</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    padding: 20,
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
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 5,
    elevation: 2,
  },
  headerButtonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 15,
    color: '#2C3E50',
  },
  list: {
    maxHeight: '35%',
  },
  userItem: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
  },
  userInfo: {
    flexDirection: 'row',
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
  groupAvatar: {
    backgroundColor: '#5856D6',
  },
  avatarText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  noDataText: {
    textAlign: 'center',
    marginTop: 10,
    fontSize: 14,
    color: '#95A5A6',
    fontStyle: 'italic',
  },
  bottomButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  profileButton: {
    backgroundColor: '#34C759',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginRight: 10,
  },
  profileButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginLeft: 10,
  },
  logoutButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
});