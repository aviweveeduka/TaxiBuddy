import { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert,
  ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';
import { loadData, saveData } from '../storage';

export default function ProfileScreen() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [area, setArea] = useState('');
  const [medical, setMedical] = useState('');
  const [saved, setSaved] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadData('profile', null).then((p) => {
        if (p) {
          setName(p.name || '');
          setPhone(p.phone || '');
          setArea(p.area || '');
          setMedical(p.medical || '');
          setSaved(true);
        }
      });
    }, [])
  );

  const save = async () => {
    const digits = phone.replace(/\D/g, '');
    if (name.trim().length < 2) {
      Alert.alert('Missing name', 'Please enter your name.');
      return;
    }
    if (phone.trim() && digits.length < 10) {
      Alert.alert('Invalid number', 'Please enter a valid phone number (at least 10 digits), or leave it empty.');
      return;
    }
    await saveData('profile', {
      name: name.trim(),
      phone: phone.trim(),
      area: area.trim(),
      medical: medical.trim(),
    });
    setSaved(true);
    Alert.alert('Profile saved', 'Your details will now appear in your trip alerts.');
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.dark }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.avatarWrap}>
          <Ionicons name="person-circle" size={90} color={colors.yellow} />
          <Text style={styles.avatarText}>{saved && name ? name : 'Set up your profile'}</Text>
        </View>

        <Text style={styles.label}>Full name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Aviwe Duka"
          placeholderTextColor={colors.muted}
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>Your phone number (optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 082 123 4567"
          placeholderTextColor={colors.muted}
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />

        <Text style={styles.label}>Home area (optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Mdantsane NU 2"
          placeholderTextColor={colors.muted}
          value={area}
          onChangeText={setArea}
        />

        <Text style={styles.label}>Medical note (optional)</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          placeholder="e.g. Asthma, allergic to penicillin"
          placeholderTextColor={colors.muted}
          multiline
          value={medical}
          onChangeText={setMedical}
        />

        <Text style={styles.hint}>
          Your details stay on this phone. Your name is added to the messages sent to your trusted contacts, and your home area and medical note are added to overdue alerts.
        </Text>

        <TouchableOpacity style={styles.button} onPress={save}>
          <Ionicons name="save" size={20} color={colors.dark} />
          <Text style={styles.buttonText}>  Save Profile</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  avatarWrap: { alignItems: 'center', marginBottom: 8 },
  avatarText: { color: colors.text, fontSize: 20, fontWeight: 'bold', marginTop: 4 },
  label: { color: colors.muted, marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: colors.card, color: colors.text, borderRadius: 10,
    padding: 14, fontSize: 16,
  },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  hint: { color: colors.muted, marginTop: 16, textAlign: 'center', fontSize: 13 },
  button: {
    backgroundColor: colors.yellow, borderRadius: 10, padding: 16, marginTop: 20,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
  },
  buttonText: { color: colors.dark, fontWeight: 'bold', fontSize: 18 },
});
