import React, { createContext, useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { Audio } from 'expo-av';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const AlertContext = createContext();

export const AlertProvider = ({ children }) => {
  const [alertTriggered, setAlertTriggered] = useState(false);
  const [threshold, setThreshold] = useState(1.5); // Default 1.5g
  const [sound, setSound] = useState();

  useEffect(() => {
    loadThreshold();
  }, []);

  const loadThreshold = async () => {
    try {
      const saved = await AsyncStorage.getItem('@seismic_threshold');
      if (saved) setThreshold(parseFloat(saved));
    } catch (e) {
      console.log('Error loading threshold', e);
    }
  };

  const updateThreshold = async (val) => {
    setThreshold(val);
    await AsyncStorage.setItem('@seismic_threshold', val.toString());
  };

  const triggerAlert = async (vibrationValue) => {
    if (alertTriggered) return; // Prevent multiple tiggers

    setAlertTriggered(true);

    // Play Local Alarm
    try {
      // You can use a local alarm file placed in assets or a standard sound block
      const { sound } = await Audio.Sound.createAsync(
        require('../../assets/alarm.mp3'), // Replace with actual asset if available or use beep
        { shouldPlay: true, isLooping: true }
      );
      setSound(sound);
    } catch (error) {
      console.log('Error playing sound', error);
    }

    // Send Push Notification
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "EARTHQUAKE ALERT!",
          body: `Seismic activity exceeded safe threshold. Detected: ${vibrationValue.toFixed(2)}g`,
          data: { data: 'goes here' },
        },
        trigger: null,
      });
    } catch (e) {
      console.log('Skipping push notification (requires dev build on modern Android):', e);
    }
  };

  const dismissAlert = async () => {
    setAlertTriggered(false);
    if (sound) {
      await sound.stopAsync();
      await sound.unloadAsync();
      setSound(null);
    }
  };

  return (
    <AlertContext.Provider value={{ threshold, updateThreshold, triggerAlert, alertTriggered, dismissAlert }}>
      {children}
      <Modal visible={alertTriggered} transparent={true} animationType="fade">
        <View style={styles.alertOverlay}>
          <Text style={styles.alertTitle}>CRITICAL ALERT</Text>
          <Text style={styles.alertSubtitle}>SEISMIC THRESHOLD BREACHED</Text>
          <TouchableOpacity style={styles.dismissButton} onPress={dismissAlert}>
            <Text style={styles.dismissText}>DISMISS ALARM</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </AlertContext.Provider>
  );
};

const styles = StyleSheet.create({
  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(255, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertTitle: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: '#000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 10,
    marginBottom: 10,
  },
  alertSubtitle: {
    fontSize: 20,
    color: '#fff',
    marginBottom: 40,
    letterSpacing: 2,
  },
  dismissButton: {
    backgroundColor: '#000',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ff4444',
  },
  dismissText: {
    color: '#ff4444',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 1,
  }
});
