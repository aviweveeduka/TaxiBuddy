import { View, Text, Image, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';
import { useLang } from '../i18n';
import LangToggle from '../LangToggle';

// First screen a new user sees: the taxi picture, what the app does, and a Get started button
export default function WelcomeScreen({ onStart }) {
  const { t } = useLang();
  const insets = useSafeAreaInsets();

  const points = [
    { icon: 'people', text: t('welcomePoint1') },
    { icon: 'navigate', text: t('welcomePoint2') },
    { icon: 'alert-circle', text: t('welcomePoint3') },
    { icon: 'lock-closed', text: t('welcomePoint4') },
  ];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
        <View>
          <Image source={require('../assets/taxi-hero.jpg')} style={styles.hero} resizeMode="cover" />
          <LangToggle style={{ position: 'absolute', top: insets.top + 8, right: 16 }} />
        </View>

        <View style={styles.body}>
          <Text style={styles.title}>{t('welcomeTitle')}</Text>
          <Text style={styles.tagline}>{t('welcomeTagline')}</Text>

          {points.map((p) => (
            <View key={p.icon} style={styles.point}>
              <View style={styles.pointIcon}>
                <Ionicons name={p.icon} size={20} color={colors.dark} />
              </View>
              <Text style={styles.pointText}>{p.text}</Text>
            </View>
          ))}

          <TouchableOpacity style={styles.button} onPress={onStart}>
            <Text style={styles.buttonText}>{t('getStarted')}</Text>
            <Ionicons name="arrow-forward" size={20} color={colors.dark} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.dark },
  hero: { width: '100%', height: 260 },
  body: { padding: 20 },
  title: { color: colors.yellow, fontSize: 30, fontWeight: 'bold' },
  tagline: { color: colors.text, fontSize: 16, marginTop: 6, marginBottom: 18 },
  point: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  pointIcon: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: colors.yellow,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  pointText: { color: colors.text, fontSize: 15, flex: 1 },
  button: {
    backgroundColor: colors.yellow, borderRadius: 12, padding: 16, marginTop: 18,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
  },
  buttonText: { color: colors.dark, fontWeight: 'bold', fontSize: 18, marginRight: 8 },
});
