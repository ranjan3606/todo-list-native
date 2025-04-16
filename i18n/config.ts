import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeModules, Platform } from 'react-native';
import en from './languages/en';
import es from './languages/es';
import fr from './languages/fr';

// Default language and available languages
export const DEFAULT_LANGUAGE = 'en';
export const LANGUAGES = {
  en: { name: 'English', translations: en || {} },
  es: { name: 'Español', translations: es || {} },
  fr: { name: 'Français', translations: fr || {} },
};

export type Language = keyof typeof LANGUAGES;
export type TranslationKey = keyof typeof en;

// Get device language with improved platform handling
export const getDeviceLanguage = (): Language => {
  try {
    let deviceLanguage: string = DEFAULT_LANGUAGE;
    
    if (Platform.OS === 'web') {
      // For web, use navigator.language
      deviceLanguage = navigator.language || DEFAULT_LANGUAGE;
    } else if (Platform.OS === 'ios') {
      const settings = NativeModules.SettingsManager?.settings;
      deviceLanguage = settings?.AppleLocale || 
                      settings?.AppleLanguages?.[0] || 
                      DEFAULT_LANGUAGE;
    } else if (Platform.OS === 'android') {
      if (NativeModules.I18nManager) {
        deviceLanguage = NativeModules.I18nManager.localeIdentifier || DEFAULT_LANGUAGE;
      }
    }
    
    // Extract the language code (first 2 characters)
    const languageCode = deviceLanguage.slice(0, 2).toLowerCase();
    
    // Check if the device language is supported
    return LANGUAGES[languageCode as Language] ? 
      (languageCode as Language) : 
      DEFAULT_LANGUAGE;
  } catch (error) {
    console.warn('Error detecting device language:', error);
    return DEFAULT_LANGUAGE;
  }
};

// Storage key for language preference
export const LANGUAGE_STORAGE_KEY = '@language_preference';

// Get the stored language preference with better error handling
export const getStoredLanguage = async (): Promise<Language> => {
  try {
    const storedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (storedLanguage && LANGUAGES[storedLanguage as Language]) {
      return storedLanguage as Language;
    }
    
    try {
      // Fall back to device language if stored preference is invalid
      const deviceLang = getDeviceLanguage();
      return deviceLang;
    } catch (deviceLangError) {
      console.warn('Error getting device language:', deviceLangError);
      return DEFAULT_LANGUAGE;
    }
  } catch (error) {
    console.warn('Error retrieving language preference:', error);
    return DEFAULT_LANGUAGE;
  }
};

// Save language preference
export const saveLanguagePreference = async (language: Language): Promise<void> => {
  try {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch (error) {
    console.error('Error saving language preference:', error);
  }
};
