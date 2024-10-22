import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { getUsers, sendMessage, getMessages } from '../services/api';

export default function NewMessageScreen({ navigation }) {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [newUserName, setNewUserName] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const fetchedUsers = await getUsers();
      setUsers(fetchedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      Alert.alert('Error', 'Failed to fetch users. Please try again.');
    }
  };

  const handleAddUser = () => {
    if (newUserName.trim() === '') {
      Alert.alert('Error', 'Please enter a user name');
      return;
    }
    const newUser = {
      id: `temp_${Date.now().toString()}`,
      displayName: newUserName.trim()
    };
    setUsers([...users, newUser]);
    setNewUserName('');
    Alert.alert('Success', 'New user added successfully');
  };

  const handleUserSelect = async (user) => {
    setSelectedUser(user);
    try {
      const fetchedMessages = await getMessages(user.id);
      setMessages(fetchedMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      Alert.alert('Error', 'Failed to fetch messages. Please try again.');
    }
  };

  const handleSendMessage = async () => {
    if (!selectedUser) {
      Alert.alert('Error', 'Please select a user');
      return;
    }
    if (!message.trim()) {
      Alert.alert('Error', 'Please enter a message');
      return;
    }
    try {
      const response = await sendMessage(selectedUser.id, message, true);
      console.log('Message sent:', response);

      const newMessage = {
        _id: response._id || Date.now().toString(),
        content: message,
        sender: 'You',
        createdAt: new Date().toISOString(),
      };
      setMessages(prevMessages => [newMessage, ...prevMessages]);
      
      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', error.message || 'Failed to send message. Please try again.');
    }
  };

  const renderUserItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.userItem, selectedUser?.id === item.id && styles.selectedUserItem]}
      onPress={() => handleUserSelect(item)}
    >
      <Text style={styles.userName}>{item.displayName}</Text>
    </TouchableOpacity>
  );

  const renderMessageItem = ({ item }) => {
    const isCurrentUser = item.sender === 'You';
    const senderName = isCurrentUser ? 'You' : selectedUser?.displayName || item.sender;
    
    return (
      <View style={[
        styles.messageItem,
        isCurrentUser ? styles.sentMessageContainer : styles.receivedMessageContainer
      ]}>
        <View style={[
          styles.messageContent,
          isCurrentUser ? styles.sentMessage : styles.receivedMessage
        ]}>
          <Text style={[
            styles.messageSender,
            isCurrentUser ? styles.sentSenderName : styles.receivedSenderName
          ]}>
            {senderName}
          </Text>
          <Text style={styles.messageText}>{item.content}</Text>
          <Text style={styles.messageTimestamp}>
            {new Date(item.createdAt).toLocaleTimeString()}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
    >
      <ScrollView style={styles.scrollView}>
        <View style={styles.addUserSection}>
          <TextInput
            style={styles.input}
            placeholder="Enter new user name"
            value={newUserName}
            onChangeText={setNewUserName}
          />
          <TouchableOpacity style={styles.addButton} onPress={handleAddUser}>
            <Text style={styles.buttonText}>Add User</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>Select a user to message:</Text>
        <FlatList
          data={users}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.id.toString()}
          style={styles.userList}
        />

        {selectedUser && (
          <View style={styles.chatSection}>
            <Text style={styles.chatTitle}>Chat with {selectedUser.displayName}</Text>
            <FlatList
              data={messages}
              renderItem={renderMessageItem}
              keyExtractor={(item) => item._id.toString()}
              style={styles.messageList}
              inverted
            />
          </View>
        )}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.messageInput}
          placeholder="Type your message here"
          value={message}
          onChangeText={setMessage}
          multiline
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
          <Text style={styles.buttonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
    padding: 10,
  },
  addUserSection: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  input: {
    flex: 1,
    height: 40,
    borderColor: '#cccccc',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginRight: 10,
    backgroundColor: '#ffffff',
  },
  addButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 5,
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  userList: {
    maxHeight: 200,
    marginBottom: 10,
  },
  userItem: {
    padding: 15,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  selectedUserItem: {
    backgroundColor: '#e6e6e6',
  },
  userName: {
    fontSize: 16,
  },
  chatSection: {
    flex: 1,
    marginBottom: 10,
  },
  chatTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  messageList: {
    flex: 1,
  },
  messageItem: {
    padding: 5,
    marginVertical: 3,
    width: '100%',
  },
  messageContent: {
    padding: 10,
    borderRadius: 10,
    maxWidth: '80%',
  },
  sentMessageContainer: {
    alignItems: 'flex-end',
  },
  receivedMessageContainer: {
    alignItems: 'flex-start',
  },
  sentMessage: {
    backgroundColor: '#DCF8C6',
    borderTopRightRadius: 2,
  },
  receivedMessage: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 2,
  },
  messageSender: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  sentSenderName: {
    textAlign: 'right',
    color: '#666',
  },
  receivedSenderName: {
    textAlign: 'left',
    color: '#666',
  },
  messageText: {
    fontSize: 16,
    color: '#000',
  },
  messageTimestamp: {
    fontSize: 11,
    color: '#888',
    alignSelf: 'flex-end',
    marginTop: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#ffffff',
  },
  messageInput: {
    flex: 1,
    height: 40,
    borderColor: '#cccccc',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginRight: 10,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  }
});