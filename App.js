import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import * as Notifications from 'expo-notifications';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getDatabase, ref, set } from 'firebase/database';
import * as Location from 'expo-location';

import { AlertProvider } from './src/context/AlertContext';
import DashboardScreen from './src/screens/DashboardScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import SafetyScreen from './src/screens/SafetyScreen';
import EmergencyMap from './src/screens/EmergencyMap';
import { TouchableOpacity, Text, View, TextInput, Alert } from 'react-native';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: { backgroundColor: '#1a1a1a', borderTopColor: '#333' },
        tabBarActiveTintColor: '#FF3B30',
        tabBarInactiveTintColor: '#888',
        tabBarIcon: ({ color, size }) => {
          let iconName = 'alert-circle';
          if (route.name === 'Home') iconName = 'home';
          if (route.name === 'Safety') iconName = 'people';
          if (route.name === 'Map') iconName = 'map';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={DashboardScreen} />
      <Tab.Screen name="Safety" component={SafetyScreen} />
      <Tab.Screen name="Map" component={EmergencyMap} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [user, setUser] = React.useState(null);
  const [userName, setUserName] = React.useState('');

  const handleLogin = async () => {
    if (!userName.trim()) {
      Alert.alert('Name Required', 'Please enter your name to connect.');
      return;
    }
    
    try {
      const userCred = await signInAnonymously(getAuth());
      setUser(userCred.user);
      
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        let location = await Location.getCurrentPositionAsync({});
        // Update user profile in RTDB
        set(ref(getDatabase(), `users/${userCred.user.uid}`), {
          displayName: userName.trim(),
          email: `${userName.trim().toLowerCase().replace(' ', '')}@anonymous.local`,
          photoURL: "https://cdn-icons-png.flaticon.com/512/149/149071.png",
          lastLocation: {
            lat: location.coords.latitude,
            lng: location.coords.longitude
          }
        });
      } else {
        // Just save name if location denied
        set(ref(getDatabase(), `users/${userCred.user.uid}`), {
          displayName: userName.trim(),
          email: `${userName.trim().toLowerCase().replace(' ', '')}@anonymous.local`,
          photoURL: "https://cdn-icons-png.flaticon.com/512/149/149071.png"
        });
      }
    } catch (e) {
      Alert.alert('Login Error', e.message);
    }
  };

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

  if (!user) {
    return (
      <View style={{ flex: 1, backgroundColor: '#050505', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ fontSize: 32, color: '#fff', fontWeight: 'bold', marginBottom: 10 }}>Seismic Monitor</Text>
        <Text style={{ fontSize: 16, color: '#aaa', marginBottom: 30, textAlign: 'center' }}>Enter your name to connect with your Safety Network.</Text>
        
        <TextInput 
          style={{ width: '100%', backgroundColor: '#1a1a1a', color: '#fff', padding: 15, borderRadius: 8, marginBottom: 15, borderWidth: 1, borderColor: '#333' }}
          placeholder="Your Name..."
          placeholderTextColor="#666"
          value={userName}
          onChangeText={setUserName}
          autoCapitalize="words"
        />

        <TouchableOpacity 
          style={{ width: '100%', backgroundColor: '#4a90e2', padding: 15, borderRadius: 8, alignItems: 'center' }}
          onPress={handleLogin}
        >
          <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 18 }}>Connect to Network</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <AlertProvider>
      <NavigationContainer>
        <StatusBar style="light" backgroundColor="#000" />
        <Stack.Navigator 
          initialRouteName="MainTabs" 
          screenOptions={{ 
            headerShown: false,
            contentStyle: { backgroundColor: '#050505' }
          }}
        >
          <Stack.Screen name="MainTabs" component={TabNavigator} />
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
