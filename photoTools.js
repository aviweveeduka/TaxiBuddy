import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

// Shrinks the picture to 300 px wide so it is small enough to keep with the profile
async function shrink(uri) {
  const context = ImageManipulator.manipulate(uri);
  context.resize({ width: 300 });
  const image = await context.renderAsync();
  const out = await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.7, base64: true });
  return 'data:image/jpeg;base64,' + out.base64;
}

async function pick(source, t) {
  let result;
  if (source === 'camera') {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(t('cameraPermTitle'), t('cameraPermMsg'));
      return null;
    }
    result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.7 });
  } else {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(t('libraryPermTitle'), t('libraryPermMsg'));
      return null;
    }
    result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
  }
  if (result.canceled || !result.assets || result.assets.length === 0) return null;
  return shrink(result.assets[0].uri);
}

// Asks "Take photo / Choose from gallery" and calls onPicked(dataUri) with the small picture
export function chooseProfilePhoto(t, onPicked) {
  const run = (source) => async () => {
    try {
      const uri = await pick(source, t);
      if (uri) onPicked(uri);
    } catch (e) {
      Alert.alert(t('photoErrorTitle'), t('photoErrorMsg'));
    }
  };
  Alert.alert(t('photoOptionsTitle'), undefined, [
    { text: t('takePhoto'), onPress: run('camera') },
    { text: t('choosePhoto'), onPress: run('library') },
    { text: t('cancel'), style: 'cancel' },
  ]);
}
