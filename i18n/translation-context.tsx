import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Platform } from 'react-native';
import { DEFAULT_LANGUAGE, LANGUAGES, Language, getStoredLanguage, saveLanguagePreference } from './config';

// Define the context types
export interface TranslationContextType {
  language: Language;
  setLanguage: (language: Language) => Promise<void>;
  t: (key: string, params?: Record<string, string | number>) => string;
  isRTL: boolean;
  availableLanguages: { code: Language; name: string }[];
}

// Create the context with default values
const TranslationContext = createContext<TranslationContextType>({
  language: DEFAULT_LANGUAGE,
  setLanguage: async () => {},
  t: (key) => key,
  isRTL: false,
  availableLanguages: [],
});

export function createTranslationContext() {
  const TranslationProvider = ({ children }: { children: ReactNode }) => {
    const [language, setLanguageState] = useState<Language>(DEFAULT_LANGUAGE);
    const [isLoading, setIsLoading] = useState(true);
    const [availableLanguages, setAvailableLanguages] = useState<{ code: Language; name: string }[]>([]);
    
    // Load language once on mount
    useEffect(() => {
      let mounted = true;
      
      const init = async () => {
        try {
          // Get language preference with fallback
          let lang = DEFAULT_LANGUAGE as Language;
          try {
            const stored = await getStoredLanguage();
            // Simple validation - ensure it's a valid language option
            if (stored && LANGUAGES[stored as Language]) {
              lang = stored as Language;
            }
          } catch (e) {
            console.warn('Failed to get stored language:', e);
          }
          
          if (!mounted) return;
          setLanguageState(lang);
          
          // Set available languages
          const langs = Object.entries(LANGUAGES).map(([code, { name }]) => ({
            code: code as Language,
            name,
          }));
          setAvailableLanguages(langs);
        } catch (error) {
          console.error('Translation initialization error:', error);
        } finally {
          if (mounted) setIsLoading(false);
        }
      };
      
      init();
      return () => { mounted = false; };
    }, []);

    // Change language function
    const setLanguage = async (newLanguage: Language) => {
      if (newLanguage === language) return;
      setLanguageState(newLanguage);
      try {
        await saveLanguagePreference(newLanguage);
      } catch (error) {
        console.error('Failed to save language preference:', error);
      }
    };

    // Simple translation function
    const t = (key: string, params?: Record<string, string | number>): string => {
      // Safety checks
      if (!key) return '';
      if (!language || !LANGUAGES[language]?.translations) return key;
      
      // Get translation or fallback to key
      const translations = LANGUAGES[language].translations || {};
      const translation = (translations as Record<string, string>)[key] || key;
      
      // Replace parameters if any
      if (!params) return translation;
      
      return Object.entries(params || {}).reduce(
        (result, [param, value]) => result.replace(
          new RegExp(`{{${param}}}`, 'g'), 
          String(value)
        ),
        translation
      );
    };

    // Determine if RTL language
    const isRTL = ['ar', 'he'].includes(language);

    if (isLoading) return null;

    return (
      <TranslationContext.Provider value={{
        language,
        setLanguage,
        t,
        isRTL,
        availableLanguages,
      }}>
        {children}
      </TranslationContext.Provider>
    );
  };

  // Custom hook
  const useTranslation = () => useContext(TranslationContext);

  return { TranslationProvider, useTranslation };
}
