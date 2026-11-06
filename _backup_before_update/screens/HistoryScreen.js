import { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';
import { loadData, saveData } from '../storage';

function formatDate(ms) {
  const d = new Date(ms);
  const date = d.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return `${date}, ${time}`;
}

function formatDuration(start, end) {
  const totalMin = Math.max(0, Math.round((end - start) / 60000));
  if (totalMin < 1) return 'under 1 min';
  if (totalMin < 60) return `${totalMin} min`;
  return `${Math.floor(totalMin / 60)} h ${totalMin % 60} min`;
}

export default function HistoryScreen() {
  const [trips, setTrips] = useState([]);

  useFocusEffect(
    useCallback(() => {
      loadData('history').then(setTrips);
    }, [])
  );

  const clearAll = () => {
    Alert.alert('Clear history', 'Delete all past trips? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete all',
        style: 'destructive',
        onPress: async () => {
          await saveData('history', []);
          setTrips([]);
        },
      },
    ]);
  };

  const renderTrip = ({ item }) => {
    const done = item.status === 'completed';
    return (
      <View style={styles.card}>
        <View style={styles.rowTop}>
          <Text style={styles.route} numberOfLines={2}>
            {item.pickup}  →  {item.destination}
          </Text>
          <View style={[styles.badge, done ? styles.badgeDone : styles.badgeCancel]}>
            <Text style={styles.badgeText}>{done ? 'Arrived' : 'Cancelled'}</Text>
          </View>
        </View>

        <View style={styles.meta}>
          <Ionicons name="car" size={14} color={colors.yellow} />
          <Text style={styles.metaText}>  {item.plate}</Text>
        </View>
        <View style={styles.meta}>
          <Ionicons name="calendar" size={14} color={colors.muted} />
          <Text style={styles.metaText}>  {formatDate(item.startTime)}</Text>
        </View>
        <View style={styles.meta}>
          <Ionicons name="time" size={14} color={colors.muted} />
          <Text style={styles.metaText}>
            {'  '}Took {formatDuration(item.startTime, item.endTime)} (planned {item.expectedMinutes} min)
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={trips}
        keyExtractor={(item) => item.id}
        renderItem={renderTrip}
        contentContainerStyle={{ padding: 16, flexGrow: 1 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="time-outline" size={64} color={colors.muted} />
            <Text style={styles.emptyTitle}>No trips yet</Text>
            <Text style={styles.emptySub}>Completed trips will appear here.</Text>
          </View>
        }
        ListFooterComponent={
          trips.length > 0 ? (
            <TouchableOpacity onPress={clearAll}>
              <Text style={styles.clear}>Clear history</Text>
            </TouchableOpacity>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.dark },
  card: { backgroundColor: colors.card, borderRadius: 10, padding: 14, marginBottom: 12 },
  rowTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 },
  route: { color: colors.text, fontSize: 16, fontWeight: 'bold', flex: 1, marginRight: 8 },
  badge: { borderRadius: 12, paddingVertical: 4, paddingHorizontal: 10 },
  badgeDone: { backgroundColor: '#2E7D32' },
  badgeCancel: { backgroundColor: '#616161' },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  meta: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  metaText: { color: colors.muted, fontSize: 14 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { color: colors.yellow, fontSize: 24, fontWeight: 'bold', marginTop: 12 },
  emptySub: { color: colors.muted, marginTop: 6 },
  clear: { color: colors.muted, textAlign: 'center', marginTop: 8, textDecorationLine: 'underline' },
});
