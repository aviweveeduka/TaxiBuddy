import { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert,
  ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';
import { loadData, saveData } from '../storage';

const DURATIONS = [1, 15, 30, 45, 60, 90];

export default function NewTripScreen({ navigation }) {
  const [pickup, setPickup] = useState('');
  const [destination, setDestination] = useState('');
  const [plate, setPlate] = useState('');
  const [minutes, setMinutes] = useState(30);
  const [contactCount, setContactCount] = useState(0);
  const [activeTrip, setActiveTrip] = useState(null);
  const [profileName, setProfileName] = useState('');

  useFocusEffect(
    useCallback(() => {
      loadData('contacts').then((c) => setContactCount(c.length));
      loadData('activeTrip', null).then(setActiveTrip);
      loadData('profile', null).then((p) => setProfileName(p && p.name ? p.name : ''));
    }, [])
  );

  const startTrip = async () => {
    if (activeTrip) {
      Alert.alert('Trip in progress', 'Finish your current trip before starting a new one.');
      return;
    }
    if (pickup.trim().length < 2 || destination.trim().length < 2) {
      Alert.alert('Missing details', 'Please enter where you are leaving from and where you are going.');
      return;
    }
    if (plate.trim().length < 3) {
      Alert.alert('Missing plate number', 'Please enter the taxi number plate.');
      return;
    }
    if (contactCount === 0) {
      Alert.alert(
        'No trusted contacts',
        'Add at least one trusted contact so someone can be alerted.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Add contact', onPress: () => navigation.navigate('Contacts') },
        ]
      );
      return;
    }

    const trip = {
      id: Date.now().toString(),
      pickup: pickup.trim(),
      destination: destination.trim(),
      plate: plate.trim().toUpperCase(),
      expectedMinutes: minutes,
      startTime: Date.now(),
      status: 'active',
    };

    await saveData('activeTrip', trip);
    setActiveTrip(trip);
    setPickup('');
    setDestination('');
    setPlate('');
    setMinutes(30);
    navigation.navigate('Active Trip');
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.dark }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {profileName ? <Text style={styles.greeting}>Hi, {profileName}</Text> : null}
        {activeTrip && (
          <View style={styles.banner}>
            <Ionicons name="alert-circle" size={20} color={colors.dark} />
            <Text style={styles.bannerText}>  A trip is already in progress ({activeTrip.plate})</Text>
          </View>
        )}

        <Text style={styles.label}>Leaving from (rank / pickup)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Buffalo City Taxi Rank"
          placeholderTextColor={colors.muted}
          value={pickup}
          onChangeText={setPickup}
        />

        <Text style={styles.label}>Going to</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Mdantsane NU 2"
          placeholderTextColor={colors.muted}
          value={destination}
          onChangeText={setDestination}
        />

        <Text style={styles.label}>Taxi number plate</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. CA 123 456"
          placeholderTextColor={colors.muted}
          autoCapitalize="characters"
          value={plate}
          onChangeText={setPlate}
        />

        <Text style={styles.label}>Expected trip time</Text>
        <View style={styles.chips}>
          {DURATIONS.map((m) => (
            <TouchableOpacity
              key={m}
              style={[styles.chip, minutes === m && styles.chipActive]}
              onPress={() => setMinutes(m)}
            >
              <Text style={[styles.chipText, minutes === m && styles.chipTextActive]}>{m} min</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.hint}>
          {contactCount} trusted contact{contactCount === 1 ? '' : 's'} will be alerted if you don't arrive on time.
        </Text>

        <TouchableOpacity style={styles.button} onPress={startTrip}>
          <Ionicons name="navigate" size={20} color={colors.dark} />
          <Text style={styles.buttonText}>  Start Trip</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  greeting: { color: colors.yellow, fontSize: 22, fontWeight: 'bold', marginBottom: 8 },
  banner: {
    backgroundColor: colors.yellow, borderRadius: 10, padding: 12,
    flexDirection: 'row', alignItems: 'center', marginBottom: 16,
  },
  bannerText: { color: colors.dark, fontWeight: 'bold' },
  label: { color: colors.muted, marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: colors.card, color: colors.text, borderRadius: 10,
    padding: 14, fontSize: 16,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: {
    backgroundColor: colors.card, borderRadius: 20, paddingVertical: 10,
    paddingHorizontal: 16, marginRight: 8, marginBottom: 8,
  },
  chipActive: { backgroundColor: colors.yellow },
  chipText: { color: colors.text },
  chipTextActive: { color: colors.dark, fontWeight: 'bold' },
  hint: { color: colors.muted, marginTop: 16, textAlign: 'center' },
  button: {
    backgroundColor: colors.yellow, borderRadius: 10, padding: 16, marginTop: 20,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
  },
  buttonText: { color: colors.dark, fontWeight: 'bold', fontSize: 18 },
});
