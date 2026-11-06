import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';
import { loadData, saveData } from '../storage';

const KEY = 'contacts';

export default function ContactsScreen() {
  const [contacts, setContacts] = useState([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    loadData(KEY).then(setContacts);
  }, []);

  const addContact = async () => {
    const digits = phone.replace(/\D/g, '');
    if (name.trim().length < 2) {
      Alert.alert('Missing name', "Please enter the contact's name.");
      return;
    }
    if (digits.length < 10) {
      Alert.alert('Invalid number', 'Please enter a valid phone number (at least 10 digits).');
      return;
    }
    const updated = [...contacts, { id: Date.now().toString(), name: name.trim(), phone: phone.trim() }];
    setContacts(updated);
    await saveData(KEY, updated);
    setName('');
    setPhone('');
  };

  const removeContact = (id) => {
    Alert.alert('Remove contact', 'Remove this person from your trusted contacts?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          const updated = contacts.filter((c) => c.id !== id);
          setContacts(updated);
          await saveData(KEY, updated);
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Name (e.g. Mama)"
          placeholderTextColor={colors.muted}
          value={name}
          onChangeText={setName}
        />
        <TextInput
          style={styles.input}
          placeholder="Phone number"
          placeholderTextColor={colors.muted}
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />
        <TouchableOpacity style={styles.button} onPress={addContact}>
          <Ionicons name="person-add" size={18} color={colors.dark} />
          <Text style={styles.buttonText}>  Add Contact</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={contacts}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <Text style={styles.empty}>No trusted contacts yet. Add someone who should know when you travel.</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Ionicons name="person-circle" size={36} color={colors.yellow} />
            <View style={styles.info}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.phone}>{item.phone}</Text>
            </View>
            <TouchableOpacity onPress={() => removeContact(item.id)}>
              <Ionicons name="trash" size={22} color="#FF5252" />
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.dark, padding: 16 },
  form: { marginBottom: 16 },
  input: {
    backgroundColor: colors.card, color: colors.text, borderRadius: 10,
    padding: 14, marginBottom: 10, fontSize: 16,
  },
  button: {
    backgroundColor: colors.yellow, borderRadius: 10, padding: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
  },
  buttonText: { color: colors.dark, fontWeight: 'bold', fontSize: 16 },
  card: {
    backgroundColor: colors.card, borderRadius: 10, padding: 12,
    marginBottom: 10, flexDirection: 'row', alignItems: 'center',
  },
  info: { flex: 1, marginLeft: 12 },
  name: { color: colors.text, fontSize: 16, fontWeight: 'bold' },
  phone: { color: colors.muted, marginTop: 2 },
  empty: { color: colors.muted, textAlign: 'center', marginTop: 30 },
});
