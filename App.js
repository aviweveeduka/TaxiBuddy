import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from './theme';
import { LanguageProvider, useLang } from './i18n';

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
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <NavigationContainer>
          <StatusBar style="light" />
          <Tabs />
        </NavigationContainer>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}
