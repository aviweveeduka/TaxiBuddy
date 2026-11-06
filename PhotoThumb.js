import { useState } from 'react';
import { Image, TouchableOpacity, Modal, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Small taxi photo. Tap it to see the full photo.
// Renders nothing if there is no photo or the file can no longer be found.
export default function PhotoThumb({ uri, size = 56, style }) {
  const [failed, setFailed] = useState(false);
  const [open, setOpen] = useState(false);

  if (!uri || failed) return null;

  return (
    <>
      <TouchableOpacity onPress={() => setOpen(true)} style={style}>
        <Image
          source={{ uri }}
          style={{ width: size, height: size, borderRadius: 8 }}
          onError={() => setFailed(true)}
        />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Image source={{ uri }} style={styles.full} resizeMode="contain" />
          <Ionicons name="close-circle" size={38} color="#fff" style={styles.close} />
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', alignItems: 'center', justifyContent: 'center' },
  full: { width: '100%', height: '80%' },
  close: { position: 'absolute', top: 60, right: 20 },
});
