import { Linking, Alert } from 'react-native';

// Opens the phone's dialler with the number filled in (the phone asks before it calls)
export async function callNumber(number, t) {
  try {
    await Linking.openURL('tel:' + String(number).replace(/[^\d+]/g, ''));
  } catch (e) {
    Alert.alert(t('callFailedTitle'), t('callFailedMsg'));
  }
}
