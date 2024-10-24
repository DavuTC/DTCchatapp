import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import HomeScreen from './src/screens/HomeScreen';
import NewMessageScreen from './src/screens/NewMessageScreen';
import NewGroupScreen from './src/screens/NewGroupScreen';
import ChatScreen from './src/screens/ChatScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="NewMessage" component={NewMessageScreen} options={{ title: 'New Message' }} />
        <Stack.Screen name="NewGroup" component={NewGroupScreen} options={{ title: 'New Group' }} />
        <Stack.Screen name="ChatScreen"  component={ChatScreen}
         options={({ route }) => ({ title: route.params?.name || route.params?.groupName || 'Chat', headerShown: true })} />

      </Stack.Navigator>
    </NavigationContainer>
  );
}