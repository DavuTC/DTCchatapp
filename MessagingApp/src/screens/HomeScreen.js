import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { authService } from '../services/auth';

export default function HomeScreen({ navigation }) {
  const [users, setUsers] = useState([]);
  const [directMessages, setDirectMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUsersAndMessages();
  }, []);

  const fetchUsersAndMessages = async () => {
    try {
      setIsLoading(true);
      const [fetchedUsers, fetchedMessages] = await Promise.all([
        authService.getUsers(),
        authService.getDirectMessages()
      ]);
      setUsers(fetchedUsers);
      setDirectMessages(fetchedMessages);
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

  const handleCreateGroup = async () => {
    const groupName = await new Promise((resolve) => {
      Alert.prompt(
        "Create New Group",
        "Enter the name for the new group:",
        [
          { text: "Cancel", onPress: () => resolve(null), style: "cancel" },
          { text: "OK", onPress: (name) => resolve(name) }
        ],
        "plain-text"
      );
    });

    if (groupName) {
      try {
        const newGroup = await authService.createGroup(groupName);
        Alert.alert("Success", "New group created successfully!");
        // Optionally, you can navigate to the new group or refresh the group list here
      } catch (error) {
        console.error('Error creating group:', error);
        Alert.alert("Error", "Failed to create group. Please try again.");
      }
    }
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

  const renderUserItem = ({ item }) => (
    <TouchableOpacity
      style={styles.userItem}
      onPress={() => navigation.navigate('Chat', { userId: item.id, userName: item.displayName })}
    >
      <Text style={styles.userName}>{item.displayName}</Text>
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
        <TouchableOpacity style={styles.headerButton} onPress={handleCreateGroup}>
          <Text style={styles.headerButtonText}>New Group</Text>
        </TouchableOpacity>
      </View>
      
      <Text style={styles.sectionTitle}>Direct Messages</Text>
      {users.length > 0 ? (
        <FlatList
          data={users}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.id.toString()}
        />
      ) : (
        <Text style={styles.noDataText}>No users found</Text>
      )}
      
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
    borderRadius: 5,
    flex: 1,
    marginHorizontal: 5,
  },
  headerButtonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  userItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  userName: {
    fontSize: 16,
  },
  noDataText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 20,
  },
  logoutButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});