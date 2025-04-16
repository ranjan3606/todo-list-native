import React from 'react';
import { 
  View, 
  StyleSheet, 
  SafeAreaView, 
  Platform, 
  StatusBar,
  Text,
  ViewStyle,
  TextStyle
} from 'react-native';
import { Colors } from '@/constants/Colors';
import { useActualColorScheme } from '@/services/theme';

type PageLayoutProps = {
  children: React.ReactNode;
  title?: string;
  style?: ViewStyle;
  titleStyle?: TextStyle;
  showHeader?: boolean;
};

export function PageLayout({ 
  children, 
  title,
  style,
  titleStyle,
  showHeader = true
}: PageLayoutProps) {
  const colorScheme = useActualColorScheme();

  return (
    <SafeAreaView style={[
      styles.safeArea, 
      { backgroundColor: Colors[colorScheme].background }
    ]}>
      <View style={[styles.container, style]}>
        {showHeader && title && (
          <Text style={[
            styles.header, 
            { color: Colors[colorScheme].text },
            titleStyle
          ]}>
            {title}
          </Text>
        )}
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 80 : 70, // Account for tab bar height
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 8,
  },
});
