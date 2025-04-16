import { 
  DEFAULT_LANGUAGE, 
  LANGUAGES, 
  Language, 
  TranslationKey,
  getDeviceLanguage,
  getStoredLanguage, 
  saveLanguagePreference 
} from './config';
import { createTranslationContext } from './translation-context';

// Re-export everything from config
export { 
  DEFAULT_LANGUAGE, 
  LANGUAGES, 
  Language, 
  TranslationKey,
  getDeviceLanguage,
  getStoredLanguage, 
  saveLanguagePreference 
};

// Create and export the translation context
export const { TranslationProvider, useTranslation } = createTranslationContext();
