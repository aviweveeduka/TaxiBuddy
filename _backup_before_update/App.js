import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { colors } from './theme';

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

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="light" />
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
          })}
        >
          <Tab.Screen name="New Trip" component={NewTripScreen} />
          <Tab.Screen name="Active Trip" component={ActiveTripScreen} />
          <Tab.Screen name="Contacts" component={ContactsScreen} />
          <Tab.Screen name="History" component={HistoryScreen} />
          <Tab.Screen name="Profile" component={ProfileScreen} />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
