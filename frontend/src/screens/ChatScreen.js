import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Alert,
  SafeAreaView,
  Animated,
  Keyboard
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
  const [inputHeight, setInputHeight] = useState(40);
  const flatListRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    loadCurrentUser();
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => flatListRef.current?.scrollToOffset({ offset: 0 })
    );

    return () => {
      keyboardDidShowListener.remove();
    };
  }, []);

  useEffect(() => {
    navigation.setOptions({
      title: type === 'group' ? groupName : name,
      headerStyle: {
        backgroundColor: '#007AFF',
      },
      headerTintColor: '#fff',
      headerTitleStyle: {
        fontWeight: '600',
      },
    });
    fetchMessages();
  }, [type, groupName, name, navigation]);

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
      Keyboard.dismiss();
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const renderMessage = useCallback(({ item, index }) => {
    const isOwnMessage = item.sender?._id === currentUser?.id;
    const showAvatar = !isOwnMessage && type === 'group';

    return (
      <Animated.View
        style={[
          styles.messageContainer,
          isOwnMessage ? styles.ownMessage : styles.otherMessage,
          { opacity: fadeAnim }
        ]}
      >
        {showAvatar && (
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {item.sender?.displayName?.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <View style={styles.messageContent}>
          {showAvatar && (
            <Text style={styles.senderName}>{item.sender?.displayName}</Text>
          )}
          <View style={[
            styles.messageBubble,
            isOwnMessage ? styles.ownMessageBubble : styles.otherMessageBubble
          ]}>
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
        </View>
      </Animated.View>
    );
  }, [currentUser, type, fadeAnim]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item._id}
          inverted
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContainer}
          ListEmptyComponent={() => (
            <Text style={styles.emptyText}>No messages yet</Text>
          )}
          onEndReachedThreshold={0.1}
        />
        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, { height: Math.max(40, inputHeight) }]}
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Type a message..."
            placeholderTextColor="#8E8E93"
            multiline
            maxLength={1000}
            onContentSizeChange={(event) => {
              setInputHeight(event.nativeEvent.contentSize.height);
            }}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    padding: 15,
  },
  messageContainer: {
    flexDirection: 'row',
    marginVertical: 4,
    maxWidth: '85%',
  },
  ownMessage: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  otherMessage: {
    alignSelf: 'flex-start',
  },
  avatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  messageContent: {
    flex: 1,
  },
  senderName: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 2,
    marginLeft: 12,
  },
  messageBubble: {
    borderRadius: 20,
    padding: 12,
    maxWidth: '90%',
  },
  ownMessageBubble: {
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 4,
  },
  otherMessageBubble: {
    backgroundColor: '#E5E5EA',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  ownMessageText: {
    color: '#FFFFFF',
  },
  otherMessageText: {
    color: '#000000',
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  ownMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  otherMessageTime: {
    color: '#8E8E93',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 8,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    marginRight: 8,
    fontSize: 16,
    color: '#000000',
    maxHeight: 120,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 60,
    height: 36,
  },
  sendButtonDisabled: {
    backgroundColor: '#C7C7CC',
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    color: '#8E8E93',
    fontSize: 16,
    fontStyle: 'italic',
    marginTop: 40,
  }
});