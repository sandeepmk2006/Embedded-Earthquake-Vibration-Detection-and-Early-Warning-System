import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const SettingsScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>SYSTEM CONFIG</Text>
      
      <View style={styles.card}>
        <Text style={styles.label}>SENSITIVITY CALIBRATION</Text>
        <Text style={styles.desc}>
          Since you are using the SW-420 Digital Vibration Sensor, software-level sensitivity thresholding is disabled. 
        </Text>
        <Text style={styles.descHardware}>
          Please use a screwdriver to manually adjust the blue physical potentiometer dial directly on the SW-420 sensor circuit board to calibrate the vibration threshold. Turn clockwise to increase sensitivity.
        </Text>
      </View>

      <TouchableOpacity style={styles.saveBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.saveTxt}>RETURN TO DASHBOARD</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050505',
    padding: 20,
  },
  title: {
    color: '#00ffa4',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 2,
    marginTop: 20,
    marginBottom: 30,
  },
  card: {
    backgroundColor: '#111',
    padding: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 30,
  },
  label: {
    color: '#888',
    fontSize: 12,
    letterSpacing: 2,
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#1a1a1a',
    color: '#00ffa4',
    fontSize: 22,
    fontWeight: 'bold',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#444',
  },
  desc: {
    color: '#555',
    fontSize: 12,
    marginTop: 15,
    lineHeight: 18,
  },
  descHardware: {
    color: '#00ffa4',
    fontSize: 13,
    marginTop: 15,
    lineHeight: 20,
    fontWeight: 'bold',
  },
  saveBtn: {
    backgroundColor: 'transparent',
    borderColor: '#00ffa4',
    borderWidth: 2,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveTxt: {
    color: '#00ffa4',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 2,
  }
});

export default SettingsScreen;