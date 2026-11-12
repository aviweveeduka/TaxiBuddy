import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';
import { loadData, saveData } from '../storage';
import { useLang } from '../i18n';
import { setPin, isPinFormatValid, isPinTooWeak } from '../auth';
import { chooseProfilePhoto } from '../photoTools';
import Avatar from '../Avatar';
import LangToggle from '../LangToggle';

// Registration: personal details, profile picture and a PIN
export default function RegisterScreen({ onDone, onBack }) {
  const { t } = useLang();
  const insets = useSafeAreaInsets();

  const [avatar, setAvatar] = useState(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [area, setArea] = useState('');
  const [medical, setMedical] = useState('');
  const [pin, setPinValue] = useState('');
  const [pin2, setPin2] = useState('');
  const [busy, setBusy] = useState(false);

  // If details were saved earlier (before sign-in existed), fill them in
  useEffect(() => {
    loadData('profile', null).then((p) => {
      if (!p) return;
      setName(p.name || '');
      setPhone(p.phone || '');
      setArea(p.area || '');
      setMedical(p.medical || '');
      setAvatar(p.avatar || null);
    });
  }, []);

  const problem = (message) => Alert.alert(t('checkDetails'), message);

  const create = async () => {
    if (busy) return;
    if (name.trim().length < 2) return problem(t('enterYourName'));
    if (phone.replace(/\D/g, '').length < 10) return problem(t('regEnterPhone'));
    if (!isPinFormatValid(pin)) return problem(t('errPin'));
    if (isPinTooWeak(pin)) return problem(t('errPinWeak'));
    if (pin !== pin2) return problem(t('errPinMatch'));

    setBusy(true);
    try {
      await saveData('profile', {
        name: name.trim(),
        phone: phone.trim(),
        area: area.trim(),
        medical: medical.trim(),
        avatar,
      });
      await setPin(pin);
      onDone();
    } catch (e) {
      setBusy(false);
      problem(t('regFailed'));
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.dark }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingTop: insets.top + 12, paddingBottom: insets.bottom + 30 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.topRow}>
          <TouchableOpacity onPress={onBack} style={styles.back}>
            <Ionicons name="arrow-back" size={22} color={colors.yellow} />
            <Text style={styles.backText}>  {t('back')}</Text>
          </TouchableOpacity>
          <LangToggle />
        </View>

        <Text style={styles.title}>{t('regTitle')}</Text>
        <Text style={styles.sub}>{t('regSub')}</Text>

        <TouchableOpacity style={styles.photoWrap} onPress={() => chooseProfilePhoto(t, setAvatar)}>
          <Avatar uri={avatar} size={110} />
          <View style={styles.cameraBadge}>
            <Ionicons name="camera" size={16} color={colors.dark} />
          </View>
          <Text style={styles.photoText}>{avatar ? t('changePhoto') : t('addProfilePhoto')}</Text>
        </TouchableOpacity>

        <Text style={styles.label}>{t('fullName')}</Text>
        <TextInput
          style={styles.input}
          placeholder={t('phFullName')}
          placeholderTextColor={colors.muted}
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>{t('regPhone')}</Text>
        <TextInput
          style={styles.input}
          placeholder={t('phYourPhone')}
          placeholderTextColor={colors.muted}
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />

        <Text style={styles.label}>{t('homeArea')}</Text>
        <TextInput
          style={styles.input}
          placeholder={t('phHome')}
          placeholderTextColor={colors.muted}
          value={area}
          onChangeText={setArea}
        />

        <Text style={styles.label}>{t('medicalNote')}</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          placeholder={t('phMedical')}
          placeholderTextColor={colors.muted}
          multiline
          value={medical}
          onChangeText={setMedical}
        />

        <Text style={styles.label}>{t('createPin')}</Text>
        <TextInput
          style={styles.input}
          placeholder="••••"
          placeholderTextColor={colors.muted}
          keyboardType="number-pad"
          secureTextEntry
          maxLength={6}
          value={pin}
          onChangeText={(v) => setPinValue(v.replace(/\D/g, ''))}
        />

        <Text style={styles.label}>{t('confirmPin')}</Text>
        <TextInput
          style={styles.input}
          placeholder="••••"
          placeholderTextColor={colors.muted}
          keyboardType="number-pad"
          secureTextEntry
          maxLength={6}
          value={pin2}
          onChangeText={(v) => setPin2(v.replace(/\D/g, ''))}
        />
        <Text style={styles.hint}>{t('pinHint')}</Text>

        <TouchableOpacity style={[styles.button, busy && { opacity: 0.6 }]} onPress={create} disabled={busy}>
          <Ionicons name="person-add" size={20} color={colors.dark} />
          <Text style={styles.buttonText}>  {t('createAccount')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  back: { flexDirection: 'row', alignItems: 'center' },
  backText: { color: colors.yellow, fontWeight: 'bold', fontSize: 15 },
  title: { color: colors.yellow, fontSize: 28, fontWeight: 'bold' },
  sub: { color: colors.muted, marginTop: 4 },
  photoWrap: { alignItems: 'center', marginVertical: 18 },
  cameraBadge: {
    position: 'absolute', top: 80, left: '50%', marginLeft: 26, backgroundColor: colors.yellow,
    width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center',
  },
  photoText: { color: colors.yellow, fontWeight: 'bold', marginTop: 8 },
  label: { color: colors.muted, marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: colors.card, color: colors.text, borderRadius: 10,
    padding: 14, fontSize: 16,
  },
  multiline: { minHeight: 70, textAlignVertical: 'top' },
  hint: { color: colors.muted, marginTop: 10, fontSize: 13 },
  button: {
    backgroundColor: colors.yellow, borderRadius: 12, padding: 16, marginTop: 22,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
  },
  buttonText: { color: colors.dark, fontWeight: 'bold', fontSize: 18 },
});
