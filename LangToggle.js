import { TouchableOpacity, Text } from 'react-native';
import { colors } from './theme';
import { useLang } from './i18n';

// Small English / isiXhosa switch, used on the welcome, register and sign-in screens
export default function LangToggle({ style }) {
  const { lang, setLang } = useLang();
  return (
    <TouchableOpacity
      style={[
        {
          paddingVertical: 5,
          paddingHorizontal: 12,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: colors.yellow,
          backgroundColor: 'rgba(27,27,31,0.55)',
        },
        style,
      ]}
      onPress={() => setLang(lang === 'en' ? 'xh' : 'en')}
    >
      <Text style={{ color: colors.yellow, fontWeight: 'bold', fontSize: 13 }}>
        {lang === 'en' ? 'isiXhosa' : 'English'}
      </Text>
    </TouchableOpacity>
  );
}
