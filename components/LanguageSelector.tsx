import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useTranslation } from '@/i18n';

interface LanguageSelectorProps {
  colorScheme: 'light' | 'dark';
}

export function LanguageSelector({ colorScheme }: LanguageSelectorProps) {
  const { language, setLanguage, availableLanguages, t } = useTranslation();

  return (
    <View style={styles.languageOptions}>
      {availableLanguages.map((lang) => (
        <TouchableOpacity 
          key={lang.code}
          testID={`language-option-${lang.code}`}
          style={[
            styles.languageOption, 
            language === lang.code && styles.selectedOption,
            { backgroundColor: Colors[colorScheme].cardBackground }
          ]}
          onPress={() => setLanguage(lang.code)}
        >
          <Text 
            style={[
              styles.optionText, 
              { color: Colors[colorScheme].text }
            ]}
          >
            {lang.name}
          </Text>
          {language === lang.code && (
            <FontAwesome 
              name="check" 
              size={18} 
              color={Colors.primary} 
              style={styles.checkIcon} 
            />
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  languageOptions: {
    flexDirection: 'column',
    marginTop: 10,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  selectedOption: {
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  optionText: {
    fontWeight: '500',
    fontSize: 16,
  },
  checkIcon: {
    marginLeft: 10,
  }
});
