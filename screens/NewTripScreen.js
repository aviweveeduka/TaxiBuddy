import { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert,
  ScrollView, KeyboardAvoidingView, Platform, Image,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '../theme';
import { loadData, saveData } from '../storage';
import { useLang } from '../i18n';

// 1 minute is for testing the overdue alert quickly. Remove it before final use if you like.
const DURATIONS = [1, 15, 30, 45, 60, 90];

export default function NewTripScreen({ navigation }) {
  const { t } = useLang();
  const [pickup, setPickup] = useState('');
  const [destination, setDestination] = useState('');
  const [plate, setPlate] = useState('');
  const [minutes, setMinutes] = useState(30);
  const [photo, setPhoto] = useState(null);
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

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(t('cameraPermTitle'), t('cameraPermMsg'));
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.5 });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setPhoto(result.assets[0].uri);
    }
  };

  const startTrip = async () => {
    if (activeTrip) {
      Alert.alert(t('tripInProgressTitle'), t('finishCurrentTrip'));
      return;
    }
    if (pickup.trim().length < 2 || destination.trim().length < 2) {
      Alert.alert(t('missingDetails'), t('enterRoute'));
      return;
    }
    if (plate.trim().length < 3) {
      Alert.alert(t('missingPlate'), t('enterPlate'));
      return;
    }
    if (contactCount === 0) {
      Alert.alert(t('noTrustedTitle'), t('noTrustedMsg'), [
        { text: t('cancel'), style: 'cancel' },
        { text: t('addContactShort'), onPress: () => navigation.navigate('Contacts') },
      ]);
      return;
    }

    const trip = {
      id: Date.now().toString(),
      pickup: pickup.trim(),
      destination: destination.trim(),
      plate: plate.trim().toUpperCase(),
      expectedMinutes: minutes,
      photoUri: photo,
      startTime: Date.now(),
      status: 'active',
    };

    await saveData('activeTrip', trip);
    setActiveTrip(trip);
    setPickup('');
    setDestination('');
    setPlate('');
    setPhoto(null);
    setMinutes(30);
    navigation.navigate('Active Trip');
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.dark }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {profileName ? <Text style={styles.greeting}>{t('greeting', { name: profileName })}</Text> : null}

        {activeTrip && (
          <View style={styles.banner}>
            <Ionicons name="alert-circle" size={20} color={colors.dark} />
            <Text style={styles.bannerText}>  {t('bannerInProgress', { plate: activeTrip.plate })}</Text>
          </View>
        )}

        <Text style={styles.label}>{t('labelFrom')}</Text>
        <TextInput
          style={styles.input}
          placeholder={t('phFrom')}
          placeholderTextColor={colors.muted}
          value={pickup}
          onChangeText={setPickup}
        />

        <Text style={styles.label}>{t('labelTo')}</Text>
        <TextInput
          style={styles.input}
          placeholder={t('phTo')}
          placeholderTextColor={colors.muted}
          value={destination}
          onChangeText={setDestination}
        />

        <Text style={styles.label}>{t('labelPlate')}</Text>
        <TextInput
          style={styles.input}
          placeholder={t('phPlate')}
          placeholderTextColor={colors.muted}
          autoCapitalize="characters"
          value={plate}
          onChangeText={setPlate}
        />

        <Text style={styles.label}>{t('photoLabel')}</Text>
        {photo ? (
          <View style={styles.photoWrap}>
            <Image source={{ uri: photo }} style={styles.photo} />
            <View style={styles.photoActions}>
              <TouchableOpacity style={styles.photoAction} onPress={takePhoto}>
                <Ionicons name="camera" size={16} color={colors.yellow} />
                <Text style={styles.photoActionText}>  {t('retakePhoto')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.photoAction} onPress={() => setPhoto(null)}>
                <Ionicons name="trash" size={16} color="#FF5252" />
                <Text style={[styles.photoActionText, { color: '#FF5252' }]}>  {t('remove')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity style={styles.photoBtn} onPress={takePhoto}>
            <Ionicons name="camera" size={22} color={colors.yellow} />
            <Text style={styles.photoBtnText}>  {t('takePhoto')}</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.photoHint}>{t('photoHint')}</Text>

        <Text style={styles.label}>{t('labelTime')}</Text>
        <View style={styles.chips}>
          {DURATIONS.map((m) => (
            <TouchableOpacity
              key={m}
              style={[styles.chip, minutes === m && styles.chipActive]}
              onPress={() => setMinutes(m)}
            >
              <Text style={[styles.chipText, minutes === m && styles.chipTextActive]}>
                {t('minutesShort', { n: m })}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.hint}>
          {contactCount === 1 ? t('hintOne') : t('hintMany', { n: contactCount })}
        </Text>

        <TouchableOpacity style={styles.button} onPress={startTrip}>
          <Ionicons name="navigate" size={20} color={colors.dark} />
          <Text style={styles.buttonText}>  {t('startTrip')}</Text>
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
  photoBtn: {
    backgroundColor: colors.card, borderRadius: 10, padding: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.muted, borderStyle: 'dashed',
  },
  photoBtnText: { color: colors.yellow, fontWeight: 'bold', fontSize: 16 },
  photoWrap: { backgroundColor: colors.card, borderRadius: 10, padding: 10 },
  photo: { width: '100%', height: 180, borderRadius: 8 },
  photoActions: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 10 },
  photoAction: { flexDirection: 'row', alignItems: 'center', padding: 6 },
  photoActionText: { color: colors.yellow, fontWeight: 'bold' },
  photoHint: { color: colors.muted, fontSize: 12, marginTop: 6 },
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
