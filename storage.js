import AsyncStorage from '@react-native-async-storage/async-storage';

export async function loadData(key, fallback = []) {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}

export async function saveData(key, value) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.log('Save failed', e);
  }
}
