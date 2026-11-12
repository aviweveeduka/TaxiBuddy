import { useEffect, useRef } from 'react';
import { Accelerometer } from 'expo-sensors';

// Detects 3 hard shakes within 1.5 seconds using the phone's motion sensor.
const SHAKE_G = 2.3; // how hard one shake must be (1 g is the force of gravity)
const SHAKES_NEEDED = 3;
const WINDOW_MS = 1500;
const MIN_GAP_MS = 250; // ignore readings from the same shake
const COOLDOWN_MS = 15000; // after it triggers, wait before it can trigger again

export function useShake(enabled, onShake) {
  const latest = useRef(onShake);
  latest.current = onShake;

  useEffect(() => {
    if (!enabled) return undefined;
    let subscription = null;
    let shakes = [];
    let lastShake = 0;
    let cooldownUntil = 0;
    try {
      Accelerometer.setUpdateInterval(100);
      subscription = Accelerometer.addListener(({ x, y, z }) => {
        const force = Math.sqrt(x * x + y * y + z * z);
        const now = Date.now();
        if (force < SHAKE_G || now - lastShake < MIN_GAP_MS) return;
        lastShake = now;
        shakes = shakes.filter((s) => now - s < WINDOW_MS);
        shakes.push(now);
        if (shakes.length >= SHAKES_NEEDED && now > cooldownUntil) {
          shakes = [];
          cooldownUntil = now + COOLDOWN_MS;
          latest.current();
        }
      });
    } catch (e) {}
    return () => {
      if (subscription) subscription.remove();
    };
  }, [enabled]);
}
