import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Alert } from 'react-native';
import { getDatabase, ref, get, set, child } from 'firebase/database';
import { getAuth } from 'firebase/auth';

export default function SafetyScreen({ navigation }) {
  const [contacts, setContacts] = useState([]);
  const [newContactName, setNewContactName] = useState('');
  const auth = getAuth();
  const db = getDatabase();
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!currentUser) return;
    const fetchContacts = async () => {
      const dbRef = ref(db);
      try {
        const snapshot = await get(child(dbRef, `users/${currentUser.uid}/contacts`));
        if (snapshot.exists()) {
          const contactData = snapshot.val();
          const contactList = Object.keys(contactData).map((key) => ({
            uid: key,
            ...contactData[key]
          }));
          setContacts(contactList);
        }
      } catch (error) {
        console.error('Error fetching contacts:', error);
      }
    };
    fetchContacts();
  }, [currentUser]);

  const handleAddContact = async () => {
    if (!newContactName.trim() || !currentUser) return;
    try {
      const dbRef = ref(db);
      const allUsersSnap = await get(child(dbRef, `users`));
      if (allUsersSnap.exists()) {
        const allUsers = allUsersSnap.val();
        let foundUid = null;
        let foundUser = null;
        for (const [uid, user] of Object.entries(allUsers)) {
          if (user.displayName && user.displayName.toLowerCase() === newContactName.trim().toLowerCase()) {
            foundUid = uid;
            foundUser = user;
            break;
          }
        }

        if (foundUid) {
          if (foundUid === currentUser.uid) {
            Alert.alert('Invalid', 'You cannot add yourself');
            return;
          }
          const contactRef = ref(db, `users/${currentUser.uid}/contacts/${foundUid}`);
          await set(contactRef, {
            displayName: foundUser.displayName || 'Unknown',
            email: foundUser.email || 'No email'
          });
          Alert.alert('Success', 'Contact added successfully');
          setNewContactName('');
        } else {
          Alert.alert('Not Found', 'No user found with that exact name');
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to add contact');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Safety Contacts</Text>
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Contact Name (Exact Match)..."
          placeholderTextColor="#666"
          value={newContactName}
          onChangeText={setNewContactName}
          autoCapitalize="words"
        />
        <TouchableOpacity style={styles.button} onPress={handleAddContact}>
          <Text style={styles.buttonText}>Add Contact</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={contacts}
        keyExtractor={(item) => item.uid}
        renderItem={({ item }) => (
          <View style={styles.contactItem}>
            <Text style={styles.contactName}>{item.displayName}</Text>
            <Text style={styles.contactEmail}>{item.email}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#050505' },
  header: { fontSize: 28, color: '#fff', fontWeight: 'bold', marginBottom: 20, marginTop: 40 },
  inputContainer: { flexDirection: 'row', marginBottom: 20 },
  input: { flex: 1, backgroundColor: '#1a1a1a', color: '#fff', padding: 15, borderRadius: 8, marginRight: 10 },
  button: { backgroundColor: '#4a90e2', padding: 15, borderRadius: 8, justifyContent: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  contactItem: { backgroundColor: '#1a1a1a', padding: 15, borderRadius: 8, marginBottom: 10 },
  contactName: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  contactEmail: { color: '#aaa', fontSize: 14, marginTop: 5 },
});