import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert
} from 'react-native';
import { format } from 'date-fns';
import * as SecureStore from 'expo-secure-store';
import { authService } from '../services/auth';

export default function ChatScreen({ route, navigation }) {
  const { type, name, groupName, userId, groupId } = route.params;
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Mevcut kullanıcıyı yükle
  useEffect(() => {
    loadCurrentUser();
  }, []);

  // Başlık ve mesajları yükle
  useEffect(() => {
    navigation.setOptions({
      title: type === 'group' ? groupName : name
    });
    fetchMessages();
  }, [type, groupName, name, navigation]);

  // Refresh interval (her 10 saniyede bir mesajları yenile)
  useEffect(() => {
    const interval = setInterval(fetchMessages, 10000);
    return () => clearInterval(interval);
  }, [type, userId, groupId]);

  const loadCurrentUser = async () => {
    try {
      const userString = await SecureStore.getItemAsync('user');
      if (userString) {
        setCurrentUser(JSON.parse(userString));
      } else {
        Alert.alert('Error', 'User data not found');
        navigation.navigate('Login');
      }
    } catch (error) {
      console.error('Error loading user:', error);
      Alert.alert('Error', 'Failed to load user data');
    }
  };

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const fetchedMessages = type === 'group'
        ? await authService.getGroupMessages(groupId)
        : await authService.getDirectMessages(userId);
      setMessages(fetchedMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      Alert.alert('Error', 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentUser) return;

    try {
      setSending(true);
      const messageData = {
        content: newMessage.trim(),
        type,
        ...(type === 'group' 
          ? { groupId, isDirect: false }
          : { recipientId: userId, isDirect: true }
        )
      };

      const sentMessage = await authService.sendMessage(messageData);
      setMessages(prev => [sentMessage, ...prev]);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const renderMessage = useCallback(({ item }) => {
    const isOwnMessage = item.sender?._id === currentUser?.id;

    return (
      <View style={[
        styles.messageContainer,
        isOwnMessage ? styles.ownMessage : styles.otherMessage
      ]}>
        {!isOwnMessage && (
          <Text style={styles.senderName}>
            {type === 'group' ? item.sender?.displayName : ''}
          </Text>
        )}
        <Text style={[
          styles.messageText,
          isOwnMessage ? styles.ownMessageText : styles.otherMessageText
        ]}>
          {item.content}
        </Text>
        <Text style={[
          styles.messageTime,
          isOwnMessage ? styles.ownMessageTime : styles.otherMessageTime
        ]}>
          {format(new Date(item.createdAt), 'HH:mm')}
        </Text>
      </View>
    );
  }, [currentUser, type]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item._id}
        inverted
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContainer}
        ListEmptyComponent={() => (
          <Text style={styles.emptyText}>No messages yet</Text>
        )}
      />
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type a message..."
          placeholderTextColor="#666"
          multiline
          maxLength={1000}
          returnKeyType="send"
          enablesReturnKeyAutomatically
          editable={!sending}
        />
        <TouchableOpacity 
          style={[
            styles.sendButton,
            (!newMessage.trim() || sending) && styles.sendButtonDisabled
          ]}
          onPress={sendMessage}
          disabled={!newMessage.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.sendButtonText}>Send</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    padding: 15,
  },
  messageContainer: {
    maxWidth: '80%',
    marginVertical: 5,
    padding: 10,
    borderRadius: 15,
  },
  ownMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 5,
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#E9ECEF',
    borderBottomLeftRadius: 5,
  },
  senderName: {
    fontSize: 12,
    color: '#6C757D',
    marginBottom: 2,
  },
  messageText: {
    fontSize: 16,
  },
  ownMessageText: {
    color: '#FFFFFF',
  },
  otherMessageText: {
    color: '#212529',
  },
  messageTime: {
    fontSize: 11,
    marginTop: 2,
    alignSelf: 'flex-end',
  },
  ownMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  otherMessageTime: {
    color: '#6C757D',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    paddingHorizontal: 15,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#DEE2E6',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    paddingRight: 35,
    marginRight: 10,
    maxHeight: 100,
    color: '#212529',
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#B0B0B0',
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    color: '#6C757D',
    fontStyle: 'italic',
    marginTop: 20,
  }
});