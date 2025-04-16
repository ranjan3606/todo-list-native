import { Link, Stack } from 'expo-router';
import { StyleSheet, View, Text } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useActualColorScheme } from '@/services/theme';
import { FontAwesome } from '@expo/vector-icons';
import { useTranslation } from '@/i18n';

export default function NotFoundScreen() {
  const colorScheme = useActualColorScheme();
  const { t } = useTranslation();
  
  return (
    <View style={[styles.container, { backgroundColor: Colors[colorScheme].background }]}>
      <Stack.Screen options={{ title: t('notFound.oops') }} />
      
      <View style={styles.iconContainer}>
        <FontAwesome name="exclamation-triangle" size={64} color={Colors.warning} />
      </View>
      
      <Text style={[styles.title, { color: Colors[colorScheme].text }]}>
        {t('notFound.title')}
      </Text>
      
      <Text style={[styles.description, { color: Colors[colorScheme].lightText }]}>
        {t('notFound.description')}
      </Text>
      
      <Link href="/" style={styles.link}>
        <Text style={[styles.linkText, { color: Colors[colorScheme].tint }]}>
          {t('notFound.goBack')}
        </Text>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  iconContainer: {
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  description: {
    marginBottom: 20,
    textAlign: 'center',
  },
  link: {
    marginTop: 15,
    paddingVertical: 10,
  },
  linkText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
