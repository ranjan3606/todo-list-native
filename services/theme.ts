import { useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemePreference = 'light' | 'dark' | 'system';
const THEME_PREFERENCE_KEY = 'themePreference';

// Add an event system to broadcast theme changes
type ThemeChangeListener = (theme: ThemePreference) => void;
const themeChangeListeners: ThemeChangeListener[] = [];

// Function to notify all listeners about theme changes
const notifyThemeChange = (theme: ThemePreference): void => {
  themeChangeListeners.forEach(listener => listener(theme));
};

// Save theme preference to storage
export const saveThemePreference = async (preference: ThemePreference): Promise<void> => {
  try {
    // Notify listeners before saving to storage for instant UI updates
    notifyThemeChange(preference);
    await AsyncStorage.setItem(THEME_PREFERENCE_KEY, preference);
  } catch (error) {
    console.error('Error saving theme preference:', error);
  }
};

// Custom hook for theme preference
export const useThemePreference = (): [ThemePreference, React.Dispatch<React.SetStateAction<ThemePreference>>] => {
  const [preference, setPreference] = useState<ThemePreference>('system');

  // Set up theme change listener
  useEffect(() => {
    const handleThemeChange = (newTheme: ThemePreference) => {
      setPreference(newTheme);
    };
    
    // Add listener
    themeChangeListeners.push(handleThemeChange);
    
    // Initial load from storage
    const loadPreference = async () => {
      try {
        const storedPreference = await AsyncStorage.getItem(THEME_PREFERENCE_KEY);
        if (storedPreference) {
          setPreference(storedPreference as ThemePreference);
        }
      } catch (error) {
        console.error('Error loading theme preference:', error);
      }
    };

    loadPreference();
    
    // Clean up listener on unmount
    return () => {
      const index = themeChangeListeners.indexOf(handleThemeChange);
      if (index !== -1) {
        themeChangeListeners.splice(index, 1);
      }
    };
  }, []);

  // Custom setter that also updates storage and notifies other components
  const setThemePreferenceAndSave = (value: React.SetStateAction<ThemePreference>) => {
    // Handle both direct values and function updaters
    const newValue = typeof value === 'function' ? value(preference) : value;
    
    // Update local state
    setPreference(newValue);
    
    // Save to storage and notify others (async)
    saveThemePreference(newValue);
  };

  return [preference, setThemePreferenceAndSave];
};

// Hook to track theme loading state - optimized for instant transitions
export const useThemeLoading = (): boolean => {
  // Always return false to prevent loading indicator from showing during theme changes
  return false;
};

// Get the actual color scheme based on preference
export const useActualColorScheme = (): 'light' | 'dark' => {
  const deviceColorScheme = useColorScheme() as 'light' | 'dark';
  const [preference] = useThemePreference();
  const [actualColorScheme, setActualColorScheme] = useState<'light' | 'dark'>(
    deviceColorScheme || 'light'
  );

  // Use a synchronous update pattern for immediate theme changes
  useEffect(() => {
    if (preference === 'system') {
      setActualColorScheme(deviceColorScheme || 'light');
    } else {
      setActualColorScheme(preference);
    }
  }, [preference, deviceColorScheme]);

  return actualColorScheme;
};
