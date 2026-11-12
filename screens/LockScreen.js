import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Image, StyleSheet, Alert,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';
import { loadData } from '../storage';
import { useLang } from '../i18n';
import { tryUnlock, getLockState, isPinFormatValid, resetEverything } from '../auth';
import Avatar from '../Avatar';
import LangToggle from '../LangToggle';

// Sign-in: the user enters their PIN to open the app
export default function LockScreen({ onUnlock, onReset, onNewUser }) {
  const { t } = useLang();
  const insets = useSafeAreaInsets();

  const [profile, setProfile] = useState(null);
  const [pin, setPin] = useState('');
  const [message, setMessage] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    loadData('profile', null).then(setProfile);
    getLockState().then((s) => {
      const left = Math.ceil((s.lockUntil - Date.now()) / 1000);
      if (left > 0) setSecondsLeft(left);
    });
  }, []);

  // Count down while the app is temporarily locked after too many wrong PINs
  const counting = secondsLeft > 0;
  useEffect(() => {
    if (!counting) return;
    const id = setInterval(() => setSecondsLeft((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [counting]);

  const submit = async () => {
    if (busy || secondsLeft > 0) return;
    if (!isPinFormatValid(pin)) {
      setMessage(t('errPin'));
      return;
    }
    setBusy(true);
    try {
      const result = await tryUnlock(pin);
      setPin('');
      if (result.ok) {
        onUnlock();
        return;
      }
      if (result.locked) {
        setMessage('');
        setSecondsLeft(result.seconds);
      } else {
        setMessage(t('wrongPin', { n: result.left }));
      }
    } catch (e) {
      setMessage(t('regFailed'));
    }
    setBusy(false);
  };

  const forgot = () => {
    Alert.alert(t('resetTitle'), t('resetMsg'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('deleteEverything'),
        style: 'destructive',
        onPress: async () => {
          await resetEverything();
          onReset();
        },
      },
    ]);
  };

  // A different person wants to register on this phone
  const newUser = () => {
    Alert.alert(t('newHereLink'), t('newHereMsg'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('newHereGo'),
        style: 'destructive',
        onPress: async () => {
          await resetEverything();
          onNewUser();
        },
      },
    ]);
  };

  const locked = secondsLeft > 0;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.dark }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 24 }} keyboardShouldPersistTaps="handled">
        <View>
          <Image source={require('../assets/taxi-hero.jpg')} style={styles.hero} resizeMode="cover" />
          <LangToggle style={{ position: 'absolute', top: insets.top + 8, right: 16 }} />
        </View>

        <View style={styles.body}>
          <View style={styles.avatarWrap}>
            <Avatar uri={profile && profile.avatar} size={96} />
          </View>
          <Text style={styles.title}>
            {profile && profile.name ? t('lockWelcome', { name: profile.name }) : t('lockWelcomeNoName')}
          </Text>
          <Text style={styles.sub}>{t('lockEnter')}</Text>

          <TextInput
            style={[styles.pinInput, locked && { opacity: 0.4 }]}
            placeholder="••••"
            placeholderTextColor={colors.muted}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={6}
            editable={!locked}
            value={pin}
            onChangeText={(v) => setPin(v.replace(/\D/g, ''))}
            onSubmitEditing={submit}
          />

          {locked ? (
            <Text style={styles.error}>{t('lockedFor', { s: secondsLeft })}</Text>
          ) : message ? (
            <Text style={styles.error}>{message}</Text>
          ) : null}

          <TouchableOpacity
            style={[styles.button, (locked || busy) && { opacity: 0.5 }]}
            onPress={submit}
            disabled={locked || busy}
          >
            <Ionicons name="lock-open" size={20} color={colors.dark} />
            <Text style={styles.buttonText}>  {t('unlock')}</Text>
          </TouchableOpacity>

          <View style={styles.newRow}>
            <Text style={styles.newText}>{t('newHere')} </Text>
            <TouchableOpacity onPress={newUser}>
              <Text style={styles.newLink}>{t('newHereLink')}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={forgot}>
            <Text style={styles.forgot}>{t('forgotPin')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  hero: { width: '100%', height: 200 },
  body: { padding: 20, alignItems: 'center' },
  avatarWrap: { marginTop: -60, backgroundColor: colors.dark, borderRadius: 60, padding: 4 },
  title: { color: colors.yellow, fontSize: 24, fontWeight: 'bold', marginTop: 8, textAlign: 'center' },
  sub: { color: colors.muted, marginTop: 4, marginBottom: 16 },
  pinInput: {
    backgroundColor: colors.card, color: colors.text, borderRadius: 12, padding: 16,
    fontSize: 26, letterSpacing: 10, textAlign: 'center', width: '70%',
  },
  error: { color: '#FF5252', marginTop: 12, textAlign: 'center' },
  button: {
    backgroundColor: colors.yellow, borderRadius: 12, padding: 16, marginTop: 18, width: '100%',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
  },
  buttonText: { color: colors.dark, fontWeight: 'bold', fontSize: 18 },
  newRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: 22 },
  newText: { color: colors.muted },
  newLink: { color: colors.yellow, fontWeight: 'bold' },
  forgot: { color: colors.muted, marginTop: 22, textDecorationLine: 'underline' },
});
