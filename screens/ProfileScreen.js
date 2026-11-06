import { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert,
  ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';
import { loadData, saveData } from '../storage';
import { useLang } from '../i18n';

export default function ProfileScreen() {
  const { t, lang, setLang } = useLang();
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
      Alert.alert(t('missingName'), t('enterYourName'));
      return;
    }
    if (phone.trim() && digits.length < 10) {
      Alert.alert(t('invalidNumber'), t('validPhoneOrEmpty'));
      return;
    }
    await saveData('profile', {
      name: name.trim(),
      phone: phone.trim(),
      area: area.trim(),
      medical: medical.trim(),
    });
    setSaved(true);
    Alert.alert(t('profileSaved'), t('profileSavedMsg'));
  };

  const LangChip = ({ code, label }) => (
    <TouchableOpacity
      style={[styles.chip, lang === code && styles.chipActive]}
      onPress={() => setLang(code)}
    >
      <Text style={[styles.chipText, lang === code && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.dark }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.avatarWrap}>
          <Ionicons name="person-circle" size={90} color={colors.yellow} />
          <Text style={styles.avatarText}>{saved && name ? name : t('setUpProfile')}</Text>
        </View>

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
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  avatarWrap: { alignItems: 'center', marginBottom: 8 },
  avatarText: { color: colors.text, fontSize: 20, fontWeight: 'bold', marginTop: 4 },
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
  button: {
    backgroundColor: colors.yellow, borderRadius: 10, padding: 16, marginTop: 20,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
  },
  buttonText: { color: colors.dark, fontWeight: 'bold', fontSize: 18 },
});
