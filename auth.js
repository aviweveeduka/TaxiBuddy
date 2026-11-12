import { createContext } from 'react';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadData, saveData } from './storage';

// Sign-in and security for TaxiBuddy.
// The PIN is never stored. Only a salted SHA-256 hash is kept, in the phone's secure storage
// (iOS Keychain / Android Keystore).

const HASH_KEY = 'tb_pin_hash';
const SALT_KEY = 'tb_pin_salt';
const ATTEMPTS_KEY = 'tb_attempts';

export const ATTEMPTS_BEFORE_LOCK = 5; // after 5 wrong tries the app waits 30 seconds, then 60, 90...
export const AUTO_LOCK_MS = 30000; // lock when the app was in the background for more than 30 seconds

// Lets screens inside the app lock it or wipe the account (see App.js)
export const SessionContext = createContext({ lock: () => {}, wipe: () => {} });

function toHex(bytes) {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function hashPin(pin, salt) {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, salt + ':' + pin);
}

export function isPinFormatValid(pin) {
  return /^\d{4,6}$/.test(pin);
}

// Rejects PINs like 1111, 1234 or 9876
export function isPinTooWeak(pin) {
  if (/^(\d)\1+$/.test(pin)) return true;
  const d = pin.split('').map(Number);
  const up = d.every((n, i) => i === 0 || n === d[i - 1] + 1);
  const down = d.every((n, i) => i === 0 || n === d[i - 1] - 1);
  return up || down;
}

export async function hasAccount() {
  try {
    return !!(await SecureStore.getItemAsync(HASH_KEY));
  } catch (e) {
    return false;
  }
}

export async function setPin(pin) {
  const salt = toHex(await Crypto.getRandomBytesAsync(16));
  const hash = await hashPin(pin, salt);
  await SecureStore.setItemAsync(SALT_KEY, salt);
  await SecureStore.setItemAsync(HASH_KEY, hash);
  await saveData(ATTEMPTS_KEY, { count: 0, lockUntil: 0 });
}

export async function verifyPin(pin) {
  const salt = await SecureStore.getItemAsync(SALT_KEY);
  const hash = await SecureStore.getItemAsync(HASH_KEY);
  if (!salt || !hash) return false;
  return (await hashPin(pin, salt)) === hash;
}

export async function getLockState() {
  return loadData(ATTEMPTS_KEY, { count: 0, lockUntil: 0 });
}

// Checks the PIN and keeps count of wrong attempts.
// Returns { ok: true } or { ok: false, locked, seconds } or { ok: false, locked: false, left }
export async function tryUnlock(pin) {
  const state = await getLockState();
  const now = Date.now();
  if (state.lockUntil > now) {
    return { ok: false, locked: true, seconds: Math.ceil((state.lockUntil - now) / 1000) };
  }
  if (await verifyPin(pin)) {
    await saveData(ATTEMPTS_KEY, { count: 0, lockUntil: 0 });
    return { ok: true };
  }
  const count = state.count + 1;
  let lockUntil = 0;
  if (count % ATTEMPTS_BEFORE_LOCK === 0) {
    lockUntil = now + 30000 * (count / ATTEMPTS_BEFORE_LOCK);
  }
  await saveData(ATTEMPTS_KEY, { count, lockUntil });
  if (lockUntil) {
    return { ok: false, locked: true, seconds: Math.ceil((lockUntil - now) / 1000) };
  }
  return { ok: false, locked: false, left: ATTEMPTS_BEFORE_LOCK - (count % ATTEMPTS_BEFORE_LOCK) };
}

// Deletes the account, the PIN and all data on this phone
export async function resetEverything() {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (e) {}
  try {
    await SecureStore.deleteItemAsync(HASH_KEY);
    await SecureStore.deleteItemAsync(SALT_KEY);
  } catch (e) {}
  await AsyncStorage.multiRemove(['contacts', 'activeTrip', 'history', 'profile', ATTEMPTS_KEY]);
}
