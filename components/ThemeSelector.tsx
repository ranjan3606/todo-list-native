import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useTranslation } from '@/i18n';

type ThemeOption = 'light' | 'dark' | 'system';

interface ThemeSelectorProps {
  currentTheme: ThemeOption;
  colorScheme: 'light' | 'dark';
  onThemeChange: (theme: ThemeOption) => void;
}

export function ThemeSelector({ currentTheme, colorScheme, onThemeChange }: ThemeSelectorProps) {
  const { t } = useTranslation();
  
  return (
    <View style={styles.themeOptions}>
      <TouchableOpacity 
        style={[
          styles.themeOption, 
          currentTheme === 'light' && styles.selectedOption,
          { backgroundColor: Colors[colorScheme].buttonBackground }
        ]}
        onPress={() => onThemeChange('light')}
      >
        <FontAwesome name="sun-o" size={24} color={currentTheme === 'light' ? Colors.primary : Colors[colorScheme].text} />
        <Text style={[styles.optionText, { color: Colors[colorScheme].text }]}>
          {t('settings.theme.light')}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[
          styles.themeOption, 
          currentTheme === 'dark' && styles.selectedOption,
          { backgroundColor: Colors[colorScheme].buttonBackground }
        ]}
        onPress={() => onThemeChange('dark')}
      >
        <FontAwesome name="moon-o" size={24} color={currentTheme === 'dark' ? Colors.primary : Colors[colorScheme].text} />
        <Text style={[styles.optionText, { color: Colors[colorScheme].text }]}>
          {t('settings.theme.dark')}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[
          styles.themeOption, 
          currentTheme === 'system' && styles.selectedOption,
          { backgroundColor: Colors[colorScheme].buttonBackground }
        ]}
        onPress={() => onThemeChange('system')}
      >
        <FontAwesome name="mobile" size={24} color={currentTheme === 'system' ? Colors.primary : Colors[colorScheme].text} />
        <Text style={[styles.optionText, { color: Colors[colorScheme].text }]}>
          {t('settings.theme.system')}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  themeOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  themeOption: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  selectedOption: {
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  optionText: {
    marginTop: 8,
    fontWeight: '500',
  },
});
