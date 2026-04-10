import React, { createContext, useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Vibration, LogBox } from 'react-native';
import { useAudioPlayer } from 'expo-audio';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Ignore Expo Go specific warnings about notifications
LogBox.ignoreLogs([
  '`expo-notifications` functionality is not fully supported',
  'Android Push notifications (remote notifications)'
]);

try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
} catch (e) {
  // Gracefully skip if Expo Go strictly blocks it
}

export const AlertContext = createContext();

export const AlertProvider = ({ children }) => {
  const [alertTriggered, setAlertTriggered] = useState(false);

  // Setup expo-audio
  let alarmPlayer = null;
  try {
    alarmPlayer = useAudioPlayer(require('../../assets/alarm.mp3'));
  } catch (e) {
    // If require fails because asset doesn't exist yet, it's caught
  }

  const triggerAlert = async () => {
    if (alertTriggered) return; // Prevent multiple tiggers

    setAlertTriggered(true);

    // Play Local Alarm
    try {
      if (alarmPlayer) {
        alarmPlayer.loop = true;
        alarmPlayer.play();
      } else {
        throw new Error('Audio asset is null');
      }
    } catch (error) {
      console.warn('Warning: Audio asset not found or failed to load. Falling back to vibration.', error.message);
      // Fallback trigger for missing audio asset
      Vibration.vibrate([500, 500, 500], true); // Repeating pattern
    }

    // Send Push Notification
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "EARTHQUAKE ALERT!",
          body: `Significant vibration detected by the SW-420 sensor!`,
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
    Vibration.cancel(); // Stop fallback vibrations
    if (alarmPlayer) {
      alarmPlayer.pause();
    }
  };

  return (
    <AlertContext.Provider value={{ triggerAlert, alertTriggered, dismissAlert }}>
      {children}
      <Modal visible={alertTriggered} transparent={true} animationType="fade">
        <View style={styles.alertOverlay}>
          <Text style={styles.alertTitle}>CRITICAL ALERT</Text>
          <Text style={styles.alertSubtitle}>VIBRATION DETECTED</Text>
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
