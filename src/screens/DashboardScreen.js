import React, { useEffect, useState, useContext } from 'react';
import { View, Text, StyleSheet, Dimensions, KeyboardAvoidingView, Platform, TouchableOpacity, ActivityIndicator, TextInput, FlatList } from 'react-native';
import { db } from '../firebaseConfig';
import { ref, onValue } from 'firebase/database';
import { AlertContext } from '../context/AlertContext';

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

const DashboardScreen = ({ navigation }) => {
  const [isVibrating, setIsVibrating] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Chatbot State
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello. I am the Emergency & Earthquake Safety Assistant. How can I help you prepare or stay safe?' }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const { triggerAlert, alertTriggered, emergencyActive, triggerEmergencyMode, cancelEmergencyMode } = useContext(AlertContext);

  useEffect(() => {
    // Listen to seismic_data node on Firebase Realtime DB
    const seismicRef = ref(db, '/seismic_data');
    const unsubscribe = onValue(seismicRef, (snapshot) => {
      const data = snapshot.val();
      
      if (loading) setLoading(false);
      
      const currentVibrationState = (data === 1 || (data && data.vibration === 1)) ? 1 : 0;
      setIsVibrating(currentVibrationState);
      
      if (currentVibrationState === 1 && !alertTriggered) {
        triggerAlert();
      }
    });

    return () => unsubscribe();
  }, [alertTriggered, loading]);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage = { role: 'user', content: inputText.trim() };
    const updatedMessages = [...messages, userMessage];
    
    setMessages(updatedMessages);
    setInputText('');
    setIsTyping(true);

    try {
      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.EXPO_PUBLIC_GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            { 
              role: 'system', 
              content: 'You are an AI assistant specialized ONLY in emergency situations, earthquake preparedness, and safety. You MUST ONLY answer questions related to emergency situations and earthquake situations. If the user asks about anything else (like math, coding, general info, weather outside emergencies), politely decline to answer and state your purpose. Keep answers brief and actionable.' 
            },
            ...updatedMessages.map(m => ({ role: m.role, content: m.content }))
          ],
        }),
      });

      const data = await response.json();
      console.log("Groq API Response:", JSON.stringify(data));
      if (data.choices && data.choices.length > 0) {
        let aiContent = data.choices[0].message.content;
        // Strip out markdown formatting like ** or *** to keep chat clean
        aiContent = aiContent.replace(/\*{1,3}/g, '');
        
        setMessages(prev => [...prev, { ...data.choices[0].message, content: aiContent }]);
      } else {
        throw new Error(data.error ? data.error.message : "No choices from Groq");
      }
    } catch (error) {
      console.warn("Chatbot Error:", error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Connection error. Unable to reach emergency database.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  const renderMessage = ({ item }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.botBubble]}>
        <Text style={styles.messageText}>{item.content}</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerAlign]}>
        <ActivityIndicator size="large" color="#00ffa4" />
        <Text style={styles.loadingText}>Connecting to Sensor...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <Text style={styles.title}>SEISMIC MONITOR</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
          <Text style={styles.neonTextBtn}>[ SETTINGS ]</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={[styles.emergencyBtn, emergencyActive ? styles.emergencyBtnActive : null]} 
        onPress={emergencyActive ? cancelEmergencyMode : triggerEmergencyMode}
      >
        <Text style={styles.emergencyBtnText}>{emergencyActive ? "CANCEL HELP REQUEST" : "NEED HELP"}</Text>
      </TouchableOpacity>

      <Text style={styles.sectionLabel}>SW-420 DIGITAL SENSOR STATUS</Text>
      <View style={styles.cardContainer}>
        <View style={[styles.statusCard, isVibrating === 1 ? styles.statusAlert : styles.statusSafe]}>
          <Text style={styles.statusLabel}>CURRENT STATE</Text>
          <Text style={[styles.statusValue, isVibrating === 1 ? styles.textAlert : styles.textSafe]}>
            {isVibrating === 1 ? 'ALERT' : 'STABLE'}
          </Text>
        </View>
      </View>

      <Text style={styles.sectionLabel}>EMERGENCY & SAFETY AI ASSISTANT</Text>
      <View style={styles.chatContainer}>
        <FlatList
          data={messages}
          keyExtractor={(item, index) => index.toString()}
          renderItem={renderMessage}
          contentContainerStyle={styles.chatList}
          inverted={false}
        />
        
        {isTyping && (
          <Text style={styles.typingText}>Assistant is typing...</Text>
        )}

        <View style={styles.inputRow}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask about earthquake safety..."
            placeholderTextColor="#888"
          />
          <TouchableOpacity style={styles.sendBtn} onPress={handleSendMessage} disabled={isTyping || !inputText.trim()}>
            <Text style={styles.sendText}>SEND</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050505',
    padding: 20,
    paddingBottom: 0,
  },
  centerAlign: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#00ffa4',
    marginTop: 20,
    fontSize: 16,
    letterSpacing: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 20,
  },
  title: {
    color: '#00ffa4',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 2,
  },
  neonTextBtn: {
    color: '#00ffa4',
    fontSize: 14,
    fontWeight: 'bold',
  },
  sectionLabel: {
    color: '#888',
    fontSize: 12,
    letterSpacing: 2,
    marginBottom: 10,
    marginTop: 0,
  },
  cardContainer: {
    marginBottom: 20,
  },
  statusCard: {
    padding: 20,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    borderWidth: 2,
  },
  statusSafe: {
    backgroundColor: '#0a1a0f',
    borderColor: '#00ffa4',
  },
  statusAlert: {
    backgroundColor: '#1a0a0a',
    borderColor: '#ff4444',
  },
  statusLabel: {
    color: '#888',
    fontSize: 12,
    letterSpacing: 2,
    marginBottom: 10,
  },
  statusValue: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1,
  },
  textSafe: {
    color: '#00ffa4',
  },
  textAlert: {
    color: '#ff4444',
  },
  
  // Chat Styles
  chatContainer: {
    flex: 1,
    backgroundColor: '#111',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    padding: 10,
    marginBottom: 20,
  },
  chatList: {
    paddingBottom: 10,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 8,
    marginVertical: 4,
    maxWidth: '85%',
  },
  userBubble: {
    backgroundColor: '#222',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 2,
    borderWidth: 1,
    borderColor: '#444',
  },
  botBubble: {
    backgroundColor: '#0a1a0f',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 2,
    borderWidth: 1,
    borderColor: '#00ffa4',
  },
  messageText: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
  },
  typingText: {
    color: '#00ffa4',
    fontSize: 12,
    fontStyle: 'italic',
    marginBottom: 10,
  },
  emergencyBtn: {
    backgroundColor: '#ff3b30',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  emergencyBtnActive: {
    backgroundColor: '#880000',
    borderWidth: 2,
    borderColor: '#ff0000',
  },
  emergencyBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
    letterSpacing: 1,
  },
  inputRow: {
    flexDirection: 'row',
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#333',
    paddingTop: 10,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    color: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#444',
  },
  sendBtn: {
    justifyContent: 'center',
    marginLeft: 10,
    backgroundColor: 'transparent',
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#00ffa4',
  },
  sendText: {
    color: '#00ffa4',
    fontWeight: 'bold',
  }
});

export default DashboardScreen;