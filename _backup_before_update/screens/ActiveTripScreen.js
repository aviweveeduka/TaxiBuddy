import { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import * as SMS from 'expo-sms';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';
import { loadData, saveData } from '../storage';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function scheduleAlerts(trip) {
  if (trip.notifIds) return trip;
  const perm = await Notifications.requestPermissionsAsync();
  if (!perm.granted) return trip;

  const totalSec = trip.expectedMinutes * 60;
  const elapsed = Math.floor((Date.now() - trip.startTime) / 1000);
  const ids = [];

  const schedule = (seconds, title, body) =>
    Notifications.scheduleNotificationAsync({
      content: { title, body },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds,
        repeats: false,
      },
    });

  const warnIn = totalSec - 300 - elapsed;
  if (warnIn > 5) {
    ids.push(await schedule(warnIn, 'TaxiBuddy: 5 minutes left', 'Your trip is almost due. Tap "I\'ve arrived" when you get there.'));
  }
  const overdueIn = totalSec - elapsed;
  if (overdueIn > 5) {
    ids.push(await schedule(overdueIn, 'TaxiBuddy: trip overdue!', 'You have not marked your arrival. Open the app to alert your contacts.'));
  }

  const updated = { ...trip, notifIds: ids };
  await saveData('activeTrip', updated);
  return updated;
}

function formatTime(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export default function ActiveTripScreen({ navigation }) {
  const [trip, setTrip] = useState(null);
  const [coords, setCoords] = useState(null);
  const [denied, setDenied] = useState(false);
  const [now, setNow] = useState(Date.now());
  const mapRef = useRef(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      let sub = null;
      let timer = null;

      (async () => {
        const t = await loadData('activeTrip', null);
        if (!active) return;
        setTrip(t);
        if (!t) return;

        scheduleAlerts(t).then((u) => active && setTrip(u));

        timer = setInterval(() => setNow(Date.now()), 1000);

        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setDenied(true);
          return;
        }
        setDenied(false);
        try {
          const first = await Location.getCurrentPositionAsync({});
          if (active) setCoords(first.coords);
        } catch (e) {}
        const s = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.High, distanceInterval: 10, timeInterval: 5000 },
          (loc) => active && setCoords(loc.coords)
        );
        if (active) sub = s;
        else s.remove();
      })();

      return () => {
        active = false;
        if (sub) sub.remove();
        if (timer) clearInterval(timer);
      };
    }, [])
  );

  useEffect(() => {
    if (coords && mapRef.current) {
      mapRef.current.animateToRegion(
        { latitude: coords.latitude, longitude: coords.longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 },
        500
      );
    }
  }, [coords]);

  const remaining = trip ? trip.startTime + trip.expectedMinutes * 60000 - now : 0;
  const overdue = trip && remaining <= 0;

  const sendSms = async (isAlert) => {
    const contacts = await loadData('contacts');
    if (contacts.length === 0) {
      Alert.alert('No contacts', 'Add a trusted contact first.');
      return;
    }
    if (!coords) {
      Alert.alert('No location yet', 'Waiting for your GPS position. Try again in a moment.');
      return;
    }
    const available = await SMS.isAvailableAsync();
    if (!available) {
      Alert.alert('SMS unavailable', 'This device cannot send SMS.');
      return;
    }
    const profile = await loadData('profile', null);
    const link = `https://maps.google.com/?q=${coords.latitude},${coords.longitude}`;
    const name = profile && profile.name ? profile.name : 'Someone you know';
    const extra = profile
      ? `${profile.area ? ' Home area: ' + profile.area + '.' : ''}${profile.medical ? ' Medical note: ' + profile.medical + '.' : ''}`
      : '';
    const message = isAlert
      ? `ALERT: ${name} has not arrived. Taxi ${trip.plate} from ${trip.pickup} to ${trip.destination}.${extra} Last location: ${link}`
      : `${name} is travelling in taxi ${trip.plate} from ${trip.pickup} to ${trip.destination}. Follow their location: ${link}`;
    await SMS.sendSMSAsync(contacts.map((c) => c.phone), message);
  };

  const sendSos = () => {
    Alert.alert(
      'Send SOS?',
      'This opens a message to all your trusted contacts with your location and trip details.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send SOS',
          style: 'destructive',
          onPress: async () => {
            const contacts = await loadData('contacts');
            if (contacts.length === 0) {
              Alert.alert('No contacts', 'Add a trusted contact first.');
              return;
            }
            const available = await SMS.isAvailableAsync();
            if (!available) {
              Alert.alert('SMS unavailable', 'This device cannot send SMS.');
              return;
            }
            let position = coords;
            if (!position) {
              try {
                const last = await Location.getLastKnownPositionAsync();
                if (last) position = last.coords;
              } catch (e) {}
            }
            const profile = await loadData('profile', null);
            const who = profile && profile.name ? profile.name : 'Someone you know';
            const extra = profile
              ? `${profile.area ? ' Home area: ' + profile.area + '.' : ''}${profile.medical ? ' Medical note: ' + profile.medical + '.' : ''}`
              : '';
            const where = position
              ? `https://maps.google.com/?q=${position.latitude},${position.longitude}`
              : 'location not available yet';
            const message = `SOS! ${who} needs help NOW. Taxi ${trip.plate} from ${trip.pickup} to ${trip.destination}.${extra} Location: ${where}`;
            await SMS.sendSMSAsync(contacts.map((c) => c.phone), message);
          },
        },
      ]
    );
  };

  const finishTrip = async (status) => {
    if (trip.notifIds) {
      for (const id of trip.notifIds) {
        await Notifications.cancelScheduledNotificationAsync(id);
      }
    }
    const history = await loadData('history');
    await saveData('history', [{ ...trip, status, endTime: Date.now() }, ...history]);
    await saveData('activeTrip', null);
    setTrip(null);
    setCoords(null);
    navigation.navigate('History');
  };

  const confirmCancel = () =>
    Alert.alert('Cancel trip', 'End this trip without marking it as arrived?', [
      { text: 'No', style: 'cancel' },
      { text: 'Cancel trip', style: 'destructive', onPress: () => finishTrip('cancelled') },
    ]);

  if (!trip) {
    return (
      <View style={styles.empty}>
        <Ionicons name="car-outline" size={64} color={colors.muted} />
        <Text style={styles.emptyTitle}>No active trip</Text>
        <Text style={styles.emptySub}>Start one from the New Trip tab.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {coords ? (
        <MapView
          ref={mapRef}
          style={styles.map}
          showsUserLocation
          initialRegion={{
            latitude: coords.latitude,
            longitude: coords.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
        >
          <Marker coordinate={{ latitude: coords.latitude, longitude: coords.longitude }} title="You" />
        </MapView>
      ) : (
        <View style={[styles.map, styles.mapPlaceholder]}>
          <Text style={styles.emptySub}>
            {denied ? 'Location permission denied. Enable it in Settings.' : 'Getting your location...'}
          </Text>
        </View>
      )}

      <View style={styles.panel}>
        <Text style={styles.route}>{trip.pickup}  →  {trip.destination}</Text>
        <Text style={styles.plate}>Taxi: {trip.plate}</Text>

        <Text style={[styles.timer, overdue && styles.timerOverdue]}>
          {overdue ? 'OVERDUE' : formatTime(remaining)}
        </Text>
        <Text style={styles.timerLabel}>{overdue ? 'Alert your contacts now' : 'until expected arrival'}</Text>

        <TouchableOpacity
          style={[styles.btn, overdue ? styles.btnDanger : styles.btnLight]}
          onPress={() => sendSms(overdue)}
        >
          <Ionicons name={overdue ? 'warning' : 'share-social'} size={18} color={overdue ? '#fff' : colors.yellow} />
          <Text style={[styles.btnText, { color: overdue ? '#fff' : colors.yellow }]}>
            {overdue ? '  Send alert SMS' : '  Share my location'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.btn, styles.btnSos]} onPress={sendSos}>
          <Ionicons name="alert-circle" size={20} color="#fff" />
          <Text style={[styles.btnText, { color: '#fff' }]}>  SOS - I need help</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.btn, styles.btnMain]} onPress={() => finishTrip('completed')}>
          <Ionicons name="checkmark-circle" size={20} color={colors.dark} />
          <Text style={[styles.btnText, { color: colors.dark }]}>  I've arrived</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={confirmCancel}>
          <Text style={styles.cancel}>Cancel trip</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.dark },
  map: { flex: 1 },
  mapPlaceholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card },
  panel: { backgroundColor: colors.dark, padding: 16, alignItems: 'center' },
  route: { color: colors.text, fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
  plate: { color: colors.muted, marginTop: 4 },
  timer: { color: colors.yellow, fontSize: 48, fontWeight: 'bold', marginTop: 8 },
  timerOverdue: { color: '#FF5252' },
  timerLabel: { color: colors.muted, marginBottom: 12 },
  btn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderRadius: 10, padding: 14, width: '100%', marginTop: 8,
  },
  btnMain: { backgroundColor: colors.yellow },
  btnLight: { backgroundColor: colors.card },
  btnDanger: { backgroundColor: '#D32F2F' },
  btnSos: { backgroundColor: '#B71C1C' },
  btnText: { fontWeight: 'bold', fontSize: 16 },
  cancel: { color: colors.muted, marginTop: 14, textDecorationLine: 'underline' },
  empty: { flex: 1, backgroundColor: colors.dark, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { color: colors.yellow, fontSize: 24, fontWeight: 'bold', marginTop: 12 },
  emptySub: { color: colors.muted, marginTop: 6, textAlign: 'center', paddingHorizontal: 20 },
});
