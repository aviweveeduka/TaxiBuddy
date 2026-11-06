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
import { useLang } from '../i18n';
import PhotoThumb from '../PhotoThumb';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function scheduleAlerts(trip, t) {
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
    ids.push(await schedule(warnIn, t('notifWarnTitle'), t('notifWarnBody')));
  }
  const overdueIn = totalSec - elapsed;
  if (overdueIn > 5) {
    ids.push(await schedule(overdueIn, t('notifOverTitle'), t('notifOverBody')));
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

// Home area and medical note, written in the chosen language
function buildExtra(profile, t) {
  if (!profile) return '';
  return (
    (profile.area ? t('smsHome', { v: profile.area }) : '') +
    (profile.medical ? t('smsMedical', { v: profile.medical }) : '')
  );
}

export default function ActiveTripScreen({ navigation }) {
  const { t } = useLang();
  const tRef = useRef(t);
  tRef.current = t;

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
        const tr = await loadData('activeTrip', null);
        if (!active) return;
        setTrip(tr);
        if (!tr) return;

        scheduleAlerts(tr, tRef.current).then((u) => active && setTrip(u));

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
      Alert.alert(t('noContactsTitle'), t('addTrustedFirst'));
      return;
    }
    if (!coords) {
      Alert.alert(t('noLocationTitle'), t('waitingGps'));
      return;
    }
    const available = await SMS.isAvailableAsync();
    if (!available) {
      Alert.alert(t('smsUnavailable'), t('smsUnavailableMsg'));
      return;
    }
    const profile = await loadData('profile', null);
    const link = `https://maps.google.com/?q=${coords.latitude},${coords.longitude}`;
    const message = t(isAlert ? 'smsAlert' : 'smsShare', {
      name: profile && profile.name ? profile.name : t('someone'),
      plate: trip.plate,
      pickup: trip.pickup,
      dest: trip.destination,
      extra: isAlert ? buildExtra(profile, t) : '',
      link,
    });
    await SMS.sendSMSAsync(contacts.map((c) => c.phone), message);
  };

  const sendSos = () => {
    Alert.alert(t('sosTitle'), t('sosMsg'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('sendSos'),
        style: 'destructive',
        onPress: async () => {
          const contacts = await loadData('contacts');
          if (contacts.length === 0) {
            Alert.alert(t('noContactsTitle'), t('addTrustedFirst'));
            return;
          }
          const available = await SMS.isAvailableAsync();
          if (!available) {
            Alert.alert(t('smsUnavailable'), t('smsUnavailableMsg'));
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
          const link = position
            ? `https://maps.google.com/?q=${position.latitude},${position.longitude}`
            : t('locNotAvailable');
          const message = t('smsSos', {
            name: profile && profile.name ? profile.name : t('someone'),
            plate: trip.plate,
            pickup: trip.pickup,
            dest: trip.destination,
            extra: buildExtra(profile, t),
            link,
          });
          await SMS.sendSMSAsync(contacts.map((c) => c.phone), message);
        },
      },
    ]);
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
    Alert.alert(t('cancelTripTitle'), t('cancelTripMsg'), [
      { text: t('no'), style: 'cancel' },
      { text: t('cancelTrip'), style: 'destructive', onPress: () => finishTrip('cancelled') },
    ]);

  if (!trip) {
    return (
      <View style={styles.empty}>
        <Ionicons name="car-outline" size={64} color={colors.muted} />
        <Text style={styles.emptyTitle}>{t('noActiveTrip')}</Text>
        <Text style={styles.emptySub}>{t('startFromNewTrip')}</Text>
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
          <Text style={styles.emptySub}>{denied ? t('locDenied') : t('gettingLocation')}</Text>
        </View>
      )}

      <View style={styles.panel}>
        <Text style={styles.route}>{trip.pickup}  →  {trip.destination}</Text>
        <View style={styles.plateRow}>
          <PhotoThumb uri={trip.photoUri} size={44} style={{ marginRight: 10 }} />
          <Text style={styles.plate}>{t('taxiLabel', { plate: trip.plate })}</Text>
        </View>

        <Text style={[styles.timer, overdue && styles.timerOverdue]}>
          {overdue ? t('overdue') : formatTime(remaining)}
        </Text>
        <Text style={styles.timerLabel}>{overdue ? t('alertNow') : t('untilArrival')}</Text>

        <TouchableOpacity
          style={[styles.btn, overdue ? styles.btnDanger : styles.btnLight]}
          onPress={() => sendSms(overdue)}
        >
          <Ionicons name={overdue ? 'warning' : 'share-social'} size={18} color={overdue ? '#fff' : colors.yellow} />
          <Text style={[styles.btnText, { color: overdue ? '#fff' : colors.yellow }]}>
            {'  '}{overdue ? t('sendAlertSms') : t('shareLocation')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.btn, styles.btnSos]} onPress={sendSos}>
          <Ionicons name="alert-circle" size={20} color="#fff" />
          <Text style={[styles.btnText, { color: '#fff' }]}>  {t('sosButton')}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.btn, styles.btnMain]} onPress={() => finishTrip('completed')}>
          <Ionicons name="checkmark-circle" size={20} color={colors.dark} />
          <Text style={[styles.btnText, { color: colors.dark }]}>  {t('arrived')}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={confirmCancel}>
          <Text style={styles.cancel}>{t('cancelTrip')}</Text>
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
  plateRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  plate: { color: colors.muted },
  timer: { color: colors.yellow, fontSize: 48, fontWeight: 'bold', marginTop: 8 },
  timerOverdue: { color: '#FF5252', fontSize: 34 },
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
