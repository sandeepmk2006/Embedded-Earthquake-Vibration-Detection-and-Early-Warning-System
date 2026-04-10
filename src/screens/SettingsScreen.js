import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { AlertContext } from '../context/AlertContext';

const SettingsScreen = ({ navigation }) => {
  const { threshold, updateThreshold } = useContext(AlertContext);
  const [val, setVal] = useState(threshold.toString());

  const handleSave = () => {
    const num = parseFloat(val);
    if (!isNaN(num)) {
      updateThreshold(num);
      navigation.goBack();
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>SYSTEM CONFIG</Text>
      
      <View style={styles.card}>
        <Text style={styles.label}>SENSITIVITY THRESHOLD (g)</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={val}
          onChangeText={setVal}
          placeholderTextColor="#444"
        />
        <Text style={styles.desc}>
          Set the target deviation from baseline vibration. A higher number reduces false alarms but may delay earthquake detection.
        </Text>
      </View>

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
        <Text style={styles.saveTxt}>SAVE SETTINGS</Text>
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