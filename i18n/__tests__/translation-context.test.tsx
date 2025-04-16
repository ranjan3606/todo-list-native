import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { createTranslationContext } from '../translation-context';
import * as Config from '../config';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock the AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

// Mock getStoredLanguage and saveLanguagePreference
jest.mock('../config', () => {
  const originalModule = jest.requireActual('../config');
  return {
    ...originalModule,
    getStoredLanguage: jest.fn(),
    saveLanguagePreference: jest.fn(),
    DEFAULT_LANGUAGE: 'en',
    LANGUAGES: {
      en: { 
        name: 'English', 
        translations: { 
          'hello': 'Hello',
          'welcome': 'Welcome {{name}}',
        } 
      },
      es: { 
        name: 'Español', 
        translations: { 
          'hello': 'Hola',
          'welcome': 'Bienvenido {{name}}',
        } 
      },
      fr: { 
        name: 'Français',
        translations: { 
          'hello': 'Bonjour',
          'welcome': 'Bienvenue {{name}}',
        } 
      },
      ar: { 
        name: 'العربية', 
        translations: { 
          'hello': 'مرحبا',
          'welcome': 'مرحبا {{name}}',
        } 
      },
    },
  };
});

describe('TranslationContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock implementation
    (Config.getStoredLanguage as jest.Mock).mockResolvedValue('en');
  });

  it('initializes with default language when no stored language', async () => {
    // Mock getStoredLanguage to return null
    (Config.getStoredLanguage as jest.Mock).mockResolvedValue(null);
    
    const { TranslationProvider, useTranslation } = createTranslationContext();
    
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TranslationProvider>{children}</TranslationProvider>
    );
    
    const { result } = renderHook(() => useTranslation(), { wrapper });
    
    // Wait for the component to initialize
    await waitFor(() => {
      expect(result.current.language).toBe('en');
    });
    
    expect(Config.getStoredLanguage).toHaveBeenCalled();
  });

  it('initializes with stored language when available', async () => {
    // Mock getStoredLanguage to return 'es'
    (Config.getStoredLanguage as jest.Mock).mockResolvedValue('es');
    
    const { TranslationProvider, useTranslation } = createTranslationContext();
    
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TranslationProvider>{children}</TranslationProvider>
    );
    
    const { result } = renderHook(() => useTranslation(), { wrapper });
    
    // Wait for the component to initialize
    await waitFor(() => {
      expect(result.current.language).toBe('es');
    });
    
    expect(Config.getStoredLanguage).toHaveBeenCalled();
  });

  it('changes language when setLanguage is called', async () => {
    const { TranslationProvider, useTranslation } = createTranslationContext();
    
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TranslationProvider>{children}</TranslationProvider>
    );
    
    const { result } = renderHook(() => useTranslation(), { wrapper });
    
    // Wait for initialization
    await waitFor(() => {
      expect(result.current.language).toBeDefined();
    });
    
    // Initial language should be 'en'
    expect(result.current.language).toBe('en');
    
    // Change language to 'fr'
    await act(async () => {
      await result.current.setLanguage('fr');
    });
    
    // Language should be changed to 'fr'
    expect(result.current.language).toBe('fr');
    
    // saveLanguagePreference should be called with 'fr'
    expect(Config.saveLanguagePreference).toHaveBeenCalledWith('fr');
  });
  
  it('does not save language preference if language is the same', async () => {
    const { TranslationProvider, useTranslation } = createTranslationContext();
    
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TranslationProvider>{children}</TranslationProvider>
    );
    
    const { result } = renderHook(() => useTranslation(), { wrapper });
    
    // Wait for initialization
    await waitFor(() => {
      expect(result.current.language).toBeDefined();
    });
    
    // Initial language should be 'en'
    expect(result.current.language).toBe('en');
    
    // Set the same language again
    await act(async () => {
      await result.current.setLanguage('en');
    });
    
    // saveLanguagePreference should not be called
    expect(Config.saveLanguagePreference).not.toHaveBeenCalled();
  });

  it('translates keys correctly', async () => {
    const { TranslationProvider, useTranslation } = createTranslationContext();
    
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TranslationProvider>{children}</TranslationProvider>
    );
    
    const { result } = renderHook(() => useTranslation(), { wrapper });
    
    // Wait for initialization
    await waitFor(() => {
      expect(result.current.language).toBeDefined();
    });
    
    // Test translation of simple key
    expect(result.current.t('hello')).toBe('Hello');
    
    // Change language to 'es'
    await act(async () => {
      await result.current.setLanguage('es');
    });
    
    // Test translation in Spanish
    expect(result.current.t('hello')).toBe('Hola');
  });

  it('handles parameter replacement in translations', async () => {
    const { TranslationProvider, useTranslation } = createTranslationContext();
    
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TranslationProvider>{children}</TranslationProvider>
    );
    
    const { result } = renderHook(() => useTranslation(), { wrapper });
    
    // Wait for initialization
    await waitFor(() => {
      expect(result.current.language).toBeDefined();
    });
    
    // Test parameter replacement
    expect(result.current.t('welcome', { name: 'John' })).toBe('Welcome John');
    
    // Change language to 'fr'
    await act(async () => {
      await result.current.setLanguage('fr');
    });
    
    // Test parameter replacement in French
    expect(result.current.t('welcome', { name: 'Jean' })).toBe('Bienvenue Jean');
  });

  it('falls back to key if translation is not found', async () => {
    const { TranslationProvider, useTranslation } = createTranslationContext();
    
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TranslationProvider>{children}</TranslationProvider>
    );
    
    const { result } = renderHook(() => useTranslation(), { wrapper });
    
    // Wait for initialization
    await waitFor(() => {
      expect(result.current.language).toBeDefined();
    });
    
    // Test fallback for non-existent key
    const nonExistentKey = 'nonExistentKey';
    expect(result.current.t(nonExistentKey)).toBe(nonExistentKey);
  });

  it('returns empty string for empty key', async () => {
    const { TranslationProvider, useTranslation } = createTranslationContext();
    
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TranslationProvider>{children}</TranslationProvider>
    );
    
    const { result } = renderHook(() => useTranslation(), { wrapper });
    
    // Wait for initialization
    await waitFor(() => {
      expect(result.current.language).toBeDefined();
    });
    
    // Test empty key
    expect(result.current.t('')).toBe('');
  });

  it('correctly identifies RTL languages', async () => {
    const { TranslationProvider, useTranslation } = createTranslationContext();
    
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TranslationProvider>{children}</TranslationProvider>
    );
    
    const { result } = renderHook(() => useTranslation(), { wrapper });
    
    // Wait for initialization
    await waitFor(() => {
      expect(result.current.language).toBeDefined();
    });
    
    // Initially not RTL
    expect(result.current.isRTL).toBe(false);
    
    // Change to Arabic (RTL language)
    await act(async () => {
      await result.current.setLanguage('ar');
    });
    
    // Should be RTL now
    expect(result.current.isRTL).toBe(true);
    
    // Change to French (not RTL)
    await act(async () => {
      await result.current.setLanguage('fr');
    });
    
    // Should not be RTL
    expect(result.current.isRTL).toBe(false);
  });

  it('provides a list of available languages', async () => {
    const { TranslationProvider, useTranslation } = createTranslationContext();
    
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TranslationProvider>{children}</TranslationProvider>
    );
    
    const { result } = renderHook(() => useTranslation(), { wrapper });
    
    // Wait for initialization
    await waitFor(() => {
      expect(result.current.availableLanguages).toBeDefined();
    });
    
    // Check available languages
    expect(result.current.availableLanguages).toHaveLength(4); // en, es, fr, ar
    expect(result.current.availableLanguages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'en', name: 'English' }),
        expect.objectContaining({ code: 'es', name: 'Español' }),
        expect.objectContaining({ code: 'fr', name: 'Français' }),
        expect.objectContaining({ code: 'ar', name: 'العربية' }),
      ])
    );
  });

  it('handles error when saving language preference fails', async () => {
    // Mock saveLanguagePreference to throw an error
    (Config.saveLanguagePreference as jest.Mock).mockRejectedValue(new Error('Storage error'));
    
    // Spy on console.error
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    
    const { TranslationProvider, useTranslation } = createTranslationContext();
    
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TranslationProvider>{children}</TranslationProvider>
    );
    
    const { result } = renderHook(() => useTranslation(), { wrapper });
    
    // Wait for initialization
    await waitFor(() => {
      expect(result.current.language).toBeDefined();
    });
    
    // Change language should still update state even if storage fails
    await act(async () => {
      await result.current.setLanguage('fr');
    });
    
    // Language should be updated in state
    expect(result.current.language).toBe('fr');
    
    // Console error should be called
    expect(consoleErrorSpy).toHaveBeenCalled();
    
    // Restore console.error
    consoleErrorSpy.mockRestore();
  });
});