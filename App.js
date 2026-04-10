import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Notifications from 'expo-notifications';
import { StatusBar } from 'expo-status-bar';

import { AlertProvider } from './src/context/AlertContext';
import DashboardScreen from './src/screens/DashboardScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  useEffect(() => {
    // Request permission for push notifications
    const getPermissions = async () => {
      try {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') {
          console.log('Push notifications disabled');
        }
      } catch (err) {
        console.log('Push notifications not fully supported in Expo Go sandbox', err);
      }
    };
    getPermissions();
  }, []);

  return (
    <AlertProvider>
      <NavigationContainer>
        <StatusBar style="light" backgroundColor="#000" />
        <Stack.Navigator 
          initialRouteName="Dashboard" 
          screenOptions={{ 
            headerShown: false,
            contentStyle: { backgroundColor: '#050505' }
          }}
        >
          <Stack.Screen name="Dashboard" component={DashboardScreen} />
          <Stack.Screen 
            name="Settings" 
            component={SettingsScreen} 
            options={{ presentation: 'modal' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </AlertProvider>
  );
}
