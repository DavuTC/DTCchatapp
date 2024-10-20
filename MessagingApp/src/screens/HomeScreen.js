import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { authService } from '../services/auth';

export default function HomeScreen({ navigation }) {
  const [groups, setGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      setIsLoading(true);
      const groupsData = await authService.getGroups();
      console.log('Fetched groups:', groupsData);
      setGroups(Array.isArray(groupsData) ? groupsData : []);
    } catch (error) {
      console.error('Error fetching groups:', error);
      Alert.alert('Error', 'Failed to fetch groups. Please try again.');
    } finally {
      setIsLoading(false);
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

  const handleCreateGroup = async () => {
    const groupName = await new Promise((resolve) => {
      Alert.prompt(
        "Create New Group",
        "Enter the name for the new group:",
        [
          {
            text: "Cancel",
            onPress: () => resolve(null),
            style: "cancel"
          },
          {
            text: "OK",
            onPress: (name) => resolve(name)
          }
        ],
        "plain-text"
      );
    });

    if (groupName) {
      try {
        const newGroup = await authService.createGroup(groupName);
        console.log('New group created:', newGroup);
        setGroups([...groups, newGroup]);
        Alert.alert("Success", "New group created successfully!");
      } catch (error) {
        console.error('Error creating group:', error);
        Alert.alert("Error", "Failed to create group. Please try again.");
      }
    }
  };

  const renderGroupItem = ({ item }) => (
    <TouchableOpacity
      style={styles.groupItem}
      onPress={() => navigation.navigate('Chat', { groupId: item.id, groupName: item.name })}
    >
      <Text style={styles.groupName}>{item.name}</Text>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <Text>Loading groups...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Groups</Text>
      {groups.length > 0 ? (
        <FlatList
          data={groups}
          renderItem={renderGroupItem}
          keyExtractor={(item) => item.id.toString()}
        />
      ) : (
        <Text style={styles.noGroups}>You don't have any groups yet.</Text>
      )}
      <TouchableOpacity style={styles.createGroupButton} onPress={handleCreateGroup}>
        <Text style={styles.createGroupButtonText}>Create New Group</Text>
      </TouchableOpacity>
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
  title: {
    fontSize: 24,
    marginBottom: 20,
  },
  groupItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  groupName: {
    fontSize: 18,
  },
  noGroups: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },
  createGroupButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 20,
  },
  createGroupButtonText: {
    color: 'white',
    fontSize: 16,
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 16,
  },
});