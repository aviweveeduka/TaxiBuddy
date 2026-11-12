import { useState, useEffect, useRef, useMemo } from 'react';
import { View, ActivityIndicator, AppState, TouchableOpacity, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { colors } from './theme';
import { LanguageProvider, useLang } from './i18n';
import { hasAccount, SessionContext, AUTO_LOCK_MS } from './auth';

import WelcomeScreen from './screens/WelcomeScreen';
import RegisterScreen from './screens/RegisterScreen';
import LockScreen from './screens/LockScreen';
import NewTripScreen from './screens/NewTripScreen';
import ActiveTripScreen from './screens/ActiveTripScreen';
import ContactsScreen from './screens/ContactsScreen';
import HistoryScreen from './screens/HistoryScreen';
import ProfileScreen from './screens/ProfileScreen';

const Tab = createBottomTabNavigator();

const icons = {
  'New Trip': 'add-circle',
  'Active Trip': 'navigate',
  Contacts: 'people',
  History: 'time',
  Profile: 'person-circle',
};

function Tabs() {
  const { t, lang, setLang } = useLang();

  return (
    <NavigationContainer>
      <Tab.Navigator
        initialRouteName="New Trip"
        screenOptions={({ route }) => ({
          headerStyle: { backgroundColor: colors.dark },
          headerTintColor: colors.yellow,
          tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.card },
          tabBarActiveTintColor: colors.yellow,
          tabBarInactiveTintColor: colors.muted,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name={icons[route.name]} size={size} color={color} />
          ),
          headerRight: () => (
            <TouchableOpacity
              style={{
                marginRight: 14,
                paddingVertical: 4,
                paddingHorizontal: 12,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: colors.yellow,
              }}
              onPress={() => setLang(lang === 'en' ? 'xh' : 'en')}
            >
              <Text style={{ color: colors.yellow, fontWeight: 'bold', fontSize: 13 }}>
                {lang === 'en' ? 'isiXhosa' : 'English'}
              </Text>
            </TouchableOpacity>
          ),
        })}
      >
        <Tab.Screen
          name="New Trip"
          component={NewTripScreen}
          options={{ title: t('titleNewTrip'), tabBarLabel: t('tabNewTrip') }}
        />
        <Tab.Screen
          name="Active Trip"
          component={ActiveTripScreen}
          options={{ title: t('titleActiveTrip'), tabBarLabel: t('tabActiveTrip') }}
        />
        <Tab.Screen
          name="Contacts"
          component={ContactsScreen}
          options={{ title: t('titleContacts'), tabBarLabel: t('tabContacts') }}
        />
        <Tab.Screen
          name="History"
          component={HistoryScreen}
          options={{ title: t('titleHistory'), tabBarLabel: t('tabHistory') }}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileScreen}
          options={{ title: t('titleProfile'), tabBarLabel: t('tabProfile') }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

// Decides what to show: welcome and register (new user), sign-in (returning user) or the app
function Root() {
  const [stage, setStage] = useState('loading'); // loading | welcome | register | locked | app
  const leftAt = useRef(null);

  useEffect(() => {
    hasAccount().then((has) => setStage(has ? 'locked' : 'welcome'));
  }, []);

  // Lock the app again after it has been in the background for a while
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'background') {
        leftAt.current = Date.now();
      } else if (next === 'active') {
        const left = leftAt.current;
        leftAt.current = null;
        if (left && Date.now() - left > AUTO_LOCK_MS) {
          setStage((s) => (s === 'app' ? 'locked' : s));
        }
      }
    });
    return () => sub.remove();
  }, []);

  const session = useMemo(
    () => ({ lock: () => setStage('locked'), wipe: () => setStage('welcome') }),
    []
  );

  if (stage === 'loading') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.dark, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.yellow} />
      </View>
    );
  }
  if (stage === 'welcome') return <WelcomeScreen onStart={() => setStage('register')} />;
  if (stage === 'register') {
    return <RegisterScreen onDone={() => setStage('app')} onBack={() => setStage('welcome')} />;
  }
  if (stage === 'locked') {
    return <LockScreen
        onUnlock={() => setStage('app')}
        onReset={() => setStage('welcome')}
        onNewUser={() => setStage('register')}
      />;
  }
  return (
    <SessionContext.Provider value={session}>
      <Tabs />
    </SessionContext.Provider>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <StatusBar style="light" />
        <Root />
      </LanguageProvider>
    </SafeAreaProvider>
  );
}
