import { Image, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from './theme';

// Round profile picture. Shows a person icon when there is no photo yet.
export default function Avatar({ uri, size = 80 }) {
  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 2,
          borderColor: colors.yellow,
        }}
      />
    );
  }
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Ionicons name="person-circle" size={size} color={colors.yellow} />
    </View>
  );
}
