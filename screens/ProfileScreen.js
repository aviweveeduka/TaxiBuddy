import { useState, useCallback, useContext } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert,
  ScrollView, KeyboardAvoidingView, Platform, Switch,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';
import { loadData, saveData } from '../storage';
import { useLang } from '../i18n';
import {
  SessionContext, verifyPin, setPin, isPinFormatValid, isPinTooWeak, resetEverything,
} from '../auth';
import { chooseProfilePhoto } from '../photoTools';
import Avatar from '../Avatar';

export default function ProfileScreen() {
  const { t, lang, setLang } = useLang();
  const session = useContext(SessionContext);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [area, setArea] = useState('');
  const [medical, setMedical] = useState('');
  const [avatar, setAvatar] = useState(null);
  const [shakeOn, setShakeOn] = useState(true);

  const [showPin, setShowPin] = useState(false);
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [newPin2, setNewPin2] = useState('');

  useFocusEffect(
    useCallback(() => {
      loadData('shakeSos', true).then((v) => setShakeOn(v !== false));
      loadData('profile', null).then((p) => {
        if (p) {
          setName(p.name || '');
          setPhone(p.phone || '');
          setArea(p.area || '');
          setMedical(p.medical || '');
          setAvatar(p.avatar || null);
        }
      });
    }, [])
  );

  const saveProfile = async (next) => {
    await saveData('profile', {
      name: name.trim(),
      phone: phone.trim(),
      area: area.trim(),
      medical: medical.trim(),
      avatar,
      ...next,
    });
  };

  const save = async () => {
    const digits = phone.replace(/\D/g, '');
    if (name.trim().length < 2) {
      Alert.alert(t('missingName'), t('enterYourName'));
      return;
    }
    if (phone.trim() && digits.length < 10) {
      Alert.alert(t('invalidNumber'), t('validPhoneOrEmpty'));
      return;
    }
    await saveProfile();
    Alert.alert(t('profileSaved'), t('profileSavedMsg'));
  };

  // A new photo is saved straight away
  const onPhoto = async (uri) => {
    setAvatar(uri);
    await saveProfile({ avatar: uri });
  };

  const changePin = async () => {
    const bad = (msg) => Alert.alert(t('checkDetails'), msg);
    if (!(await verifyPin(oldPin))) return bad(t('wrongCurrentPin'));
    if (!isPinFormatValid(newPin)) return bad(t('errPin'));
    if (isPinTooWeak(newPin)) return bad(t('errPinWeak'));
    if (newPin !== newPin2) return bad(t('errPinMatch'));
    await setPin(newPin);
    setOldPin('');
    setNewPin('');
    setNewPin2('');
    setShowPin(false);
    Alert.alert(t('pinChanged'), t('pinChangedMsg'));
  };

  const deleteAccount = () => {
    Alert.alert(t('resetTitle'), t('resetMsg'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('deleteEverything'),
        style: 'destructive',
        onPress: async () => {
          await resetEverything();
          session.wipe();
        },
      },
    ]);
  };

  const toggleShake = async (value) => {
    setShakeOn(value);
    await saveData('shakeSos', value);
  };

  const LangChip = ({ code, label }) => (
    <TouchableOpacity
      style={[styles.chip, lang === code && styles.chipActive]}
      onPress={() => setLang(code)}
    >
      <Text style={[styles.chipText, lang === code && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );

  const pinField = (label, value, setter) => (
    <>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        placeholder="••••"
        placeholderTextColor={colors.muted}
        keyboardType="number-pad"
        secureTextEntry
        maxLength={6}
        value={value}
        onChangeText={(v) => setter(v.replace(/\D/g, ''))}
      />
    </>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.dark }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.avatarWrap} onPress={() => chooseProfilePhoto(t, onPhoto)}>
          <Avatar uri={avatar} size={100} />
          <Text style={styles.avatarText}>{name ? name : t('setUpProfile')}</Text>
          <Text style={styles.changePhoto}>{avatar ? t('changePhoto') : t('addProfilePhoto')}</Text>
        </TouchableOpacity>

        <Text style={styles.label}>{t('languageLabel')}</Text>
        <View style={styles.chips}>
          <LangChip code="en" label="English" />
          <LangChip code="xh" label="isiXhosa" />
        </View>

        <Text style={styles.label}>{t('fullName')}</Text>
        <TextInput
          style={styles.input}
          placeholder={t('phFullName')}
          placeholderTextColor={colors.muted}
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>{t('yourPhone')}</Text>
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

        <Text style={styles.hint}>{t('profileHint')}</Text>

        <TouchableOpacity style={styles.button} onPress={save}>
          <Ionicons name="save" size={20} color={colors.dark} />
          <Text style={styles.buttonText}>  {t('saveProfile')}</Text>
        </TouchableOpacity>

        <Text style={styles.section}>{t('security')}</Text>
        <Text style={styles.hint2}>{t('securityNote')}</Text>

        <View style={styles.row}>
          <Ionicons name="phone-portrait" size={20} color={colors.yellow} />
          <View style={{ flex: 1, marginLeft: 8, marginRight: 8 }}>
            <Text style={styles.rowText}>{t('shakeSosLabel')}</Text>
            <Text style={styles.rowNote}>{t('shakeSosNote')}</Text>
          </View>
          <Switch value={shakeOn} onValueChange={toggleShake} trackColor={{ true: colors.yellow }} />
        </View>

        <TouchableOpacity style={styles.row} onPress={session.lock}>
          <Ionicons name="lock-closed" size={20} color={colors.yellow} />
          <Text style={styles.rowText}>  {t('lockNow')}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.row} onPress={() => setShowPin(!showPin)}>
          <Ionicons name="key" size={20} color={colors.yellow} />
          <Text style={styles.rowText}>  {t('changePin')}</Text>
        </TouchableOpacity>

        {showPin && (
          <View style={styles.pinBox}>
            {pinField(t('currentPin'), oldPin, setOldPin)}
            {pinField(t('newPin'), newPin, setNewPin)}
            {pinField(t('confirmPin'), newPin2, setNewPin2)}
            <TouchableOpacity style={[styles.button, { marginTop: 14 }]} onPress={changePin}>
              <Text style={styles.buttonText}>{t('changePin')}</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity style={styles.row} onPress={deleteAccount}>
          <Ionicons name="trash" size={20} color="#FF5252" />
          <Text style={[styles.rowText, { color: '#FF5252' }]}>  {t('deleteAccount')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },
  avatarWrap: { alignItems: 'center', marginBottom: 8 },
  avatarText: { color: colors.text, fontSize: 20, fontWeight: 'bold', marginTop: 6 },
  changePhoto: { color: colors.yellow, marginTop: 2 },
  label: { color: colors.muted, marginBottom: 6, marginTop: 12 },
  chips: { flexDirection: 'row' },
  chip: {
    backgroundColor: colors.card, borderRadius: 20, paddingVertical: 10,
    paddingHorizontal: 18, marginRight: 8,
  },
  chipActive: { backgroundColor: colors.yellow },
  chipText: { color: colors.text },
  chipTextActive: { color: colors.dark, fontWeight: 'bold' },
  input: {
    backgroundColor: colors.card, color: colors.text, borderRadius: 10,
    padding: 14, fontSize: 16,
  },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  hint: { color: colors.muted, marginTop: 16, textAlign: 'center', fontSize: 13 },
  hint2: { color: colors.muted, fontSize: 13, marginBottom: 6 },
  button: {
    backgroundColor: colors.yellow, borderRadius: 10, padding: 16, marginTop: 20,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
  },
  buttonText: { color: colors.dark, fontWeight: 'bold', fontSize: 18 },
  section: { color: colors.yellow, fontSize: 20, fontWeight: 'bold', marginTop: 32, marginBottom: 4 },
  row: {
    backgroundColor: colors.card, borderRadius: 10, padding: 14, marginTop: 10,
    flexDirection: 'row', alignItems: 'center',
  },
  rowText: { color: colors.text, fontSize: 16, fontWeight: 'bold' },
  rowNote: { color: colors.muted, fontSize: 12, marginTop: 2 },
  pinBox: { backgroundColor: colors.card, borderRadius: 10, padding: 12, marginTop: 8 },
});
