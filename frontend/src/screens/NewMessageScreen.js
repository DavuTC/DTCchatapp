import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Animated
} from 'react-native';
import { authService } from '../services/auth';

export default function NewMessageScreen({ navigation }) {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [inputHeight, setInputHeight] = useState(40);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchUsers();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const fetchedUsers = await authService.getUsers();
      setUsers(fetchedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      Alert.alert('Error', 'Failed to fetch users');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserSelect = (user) => {
    const animation = Animated.spring(fadeAnim, {
      toValue: 0.5,
      useNativeDriver: true,
      speed: 12,
      bounciness: 8
    });
    animation.start(() => {
      setSelectedUser(user);
      Animated.spring(fadeAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 12,
        bounciness: 8
      }).start();
    });
  };

  const handleSendMessage = async () => {
    try {
      if (!selectedUser) {
        Alert.alert('Error', 'Please select a user');
        return;
      }

      if (!message.trim()) {
        Alert.alert('Error', 'Please enter a message');
        return;
      }

      setIsLoading(true);

      await authService.sendMessage({
        receiver: selectedUser._id,
        content: message.trim(),
        type: 'direct'
      });

      Alert.alert(
        'Success', 
        'Message sent successfully', 
        [{
          text: 'OK',
          onPress: () => navigation.goBack(),
          style: 'default'
        }],
        { cancelable: false }
      );
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderUserItem = ({ item }) => {
    const isSelected = selectedUser?._id === item._id;
    return (
      <Animated.View style={{ opacity: fadeAnim }}>
        <TouchableOpacity
          style={[
            styles.userItem,
            isSelected && styles.selectedUserItem
          ]}
          onPress={() => handleUserSelect(item)}
        >
          <View style={styles.userInfo}>
            <View style={[
              styles.avatarContainer,
              isSelected && styles.selectedAvatarContainer
            ]}>
              <Text style={styles.avatarText}>
                {item.displayName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.userDetails}>
              <Text style={[
                styles.userName,
                isSelected && styles.selectedUserName
              ]}>
                {item.displayName}
              </Text>
              <Text style={styles.userEmail}>{item.email}</Text>
            </View>
            {isSelected && (
              <View style={styles.checkmarkContainer}>
                <Text style={styles.checkmark}>✓</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
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
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search users..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#8E8E93"
          />
        </View>

        <Text style={styles.sectionTitle}>Select Recipient</Text>

        <View style={styles.userListContainer}>
          <FlatList
            data={filteredUsers}
            renderItem={renderUserItem}
            keyExtractor={(item) => item._id}
            ListEmptyComponent={() => (
              <Text style={styles.emptyText}>No users found</Text>
            )}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.userList}
          />
        </View>

        <View style={styles.messageContainer}>
          <Text style={styles.sectionTitle}>Message</Text>
          <TextInput
            style={[styles.messageInput, { height: Math.max(100, inputHeight) }]}
            placeholder="Type your message..."
            value={message}
            onChangeText={setMessage}
            multiline
            onContentSizeChange={(event) => {
              setInputHeight(event.nativeEvent.contentSize.height);
            }}
            placeholderTextColor="#8E8E93"
          />

          <TouchableOpacity
            style={[
              styles.sendButton,
              (!selectedUser || !message.trim()) && styles.disabledButton
            ]}
            onPress={handleSendMessage}
            disabled={!selectedUser || !message.trim()}
          >
            <Text style={styles.sendButtonText}>
              Send to {selectedUser?.displayName || 'Selected User'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7'
  },
  keyboardAvoidingView: {
    flex: 1
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA'
  },
  searchInput: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    fontSize: 16,
    color: '#000000'
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginHorizontal: 16,
    marginVertical: 12,
    color: '#1C1C1E'
  },
  userListContainer: {
    flex: 1,
  },
  userList: {
    padding: 16
  },
  userItem: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  selectedUserItem: {
    backgroundColor: '#E3F2FD',
    borderWidth: 1,
    borderColor: '#007AFF'
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  selectedAvatarContainer: {
    backgroundColor: '#005DB4'
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600'
  },
  userDetails: {
    flex: 1
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4
  },
  selectedUserName: {
    color: '#007AFF'
  },
  userEmail: {
    fontSize: 14,
    color: '#8E8E93'
  },
  checkmarkContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#34C759',
    justifyContent: 'center',
    alignItems: 'center'
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold'
  },
  messageContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA'
  },
  messageInput: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: '#000000',
    textAlignVertical: 'top',
    marginBottom: 16
  },
  sendButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center'
  },
  disabledButton: {
    backgroundColor: '#C7C7CC'
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600'
  },
  emptyText: {
    textAlign: 'center',
    color: '#8E8E93',
    fontSize: 16,
    marginTop: 32,
    fontStyle: 'italic'
  }
});