import AsyncStorage from '@react-native-async-storage/async-storage';
// Import renderHook from react-native testing library
import { renderHook, act, waitFor } from '@testing-library/react-native'; 
import { 
  useThemePreference, 
  saveThemePreference, 
  useActualColorScheme,
  useThemeLoading 
} from '../theme';
import { useColorScheme } from 'react-native';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

jest.mock('react-native', () => ({
  useColorScheme: jest.fn(),
}));

describe('Theme Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock implementation for AsyncStorage
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    // Default mock for useColorScheme
    (useColorScheme as jest.Mock).mockReturnValue('light');
  });

  describe('useThemePreference', () => {
    it('should initialize with "system" as default value', async () => {
      const { result } = renderHook(() => useThemePreference());
      
      // Initial state should be "system"
      expect(result.current[0]).toBe('system');
      
      // Wait for the effect to complete
      await waitFor(() => {
        expect(AsyncStorage.getItem).toHaveBeenCalledWith('themePreference');
      });
    });

    it('should load theme preference from AsyncStorage', async () => {
      // Mock AsyncStorage to return a saved preference
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('dark');
      
      const { result } = renderHook(() => useThemePreference());
      
      // Initial state is "system" before the async operation completes
      expect(result.current[0]).toBe('system');
      
      // Wait for the async operation to complete
      await waitFor(() => {
        expect(result.current[0]).toBe('dark');
      });
    });

    it('should save theme preference when updated', async () => {
      const { result } = renderHook(() => useThemePreference());
      
      // Wait for initial load from storage to complete
      await waitFor(() => {
        expect(AsyncStorage.getItem).toHaveBeenCalledWith('themePreference');
      });
      
      // Update the theme preference
      act(() => {
        result.current[1]('dark');
      });
      
      // Should save to AsyncStorage
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('themePreference', 'dark');
      // State should update immediately
      expect(result.current[0]).toBe('dark');
    });

    it('should handle function updaters correctly', async () => {
      // Start with light theme in storage
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('light');
      
      const { result } = renderHook(() => useThemePreference());
      await waitFor(() => {
        expect(result.current[0]).toBe('light');
      });
      
      // Update using a function
      act(() => {
        result.current[1]((prev) => prev === 'light' ? 'dark' : 'light');
      });
      
      // Should save the new value
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('themePreference', 'dark');
      // State should update immediately
      expect(result.current[0]).toBe('dark');
    });

    it('should add and remove theme change listeners', async () => {
      // We'll test this by creating two hooks and checking if they sync
      const { result: hook1 } = renderHook(() => useThemePreference());
      const { result: hook2, unmount } = renderHook(() => useThemePreference());
      
      // Wait for initial async operations
      await waitFor(() => {
        expect(AsyncStorage.getItem).toHaveBeenCalledTimes(2);
      });
      
      // Update theme from the first hook
      act(() => {
        hook1.current[1]('dark');
      });
      
      // Second hook should also have updated
      expect(hook2.current[0]).toBe('dark');
      
      // Clean up the second hook
      unmount();
      
      // Update theme again from the first hook
      act(() => {
        hook1.current[1]('light');
      });
      
      // First hook should have updated
      expect(hook1.current[0]).toBe('light');
    });
  });

  describe('saveThemePreference', () => {
    it('should save theme preference to AsyncStorage', async () => {
      await saveThemePreference('dark');
      
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('themePreference', 'dark');
    });

    it('should handle errors gracefully', async () => {
      // Mock AsyncStorage to throw an error
      (AsyncStorage.setItem as jest.Mock).mockRejectedValue(new Error('Test error'));
      
      // Spy on console.error
      jest.spyOn(console, 'error').mockImplementation(() => {});
      
      await saveThemePreference('dark');
      
      // Should log the error
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('useThemeLoading', () => {
    it('should always return false to prevent loading indicator', () => {
      const { result } = renderHook(() => useThemeLoading());
      
      expect(result.current).toBe(false);
    });
  });

  describe('useActualColorScheme', () => {
    it('should return light as default', () => {
      const { result } = renderHook(() => useActualColorScheme());
      
      expect(result.current).toBe('light');
    });

    it('should return device color scheme when preference is "system"', async () => {
      // Mock device color scheme
      (useColorScheme as jest.Mock).mockReturnValue('dark');
      
      // Mock the useThemePreference hook to return "system"
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('system');
      
      const { result } = renderHook(() => useActualColorScheme());
      
      // Wait for async operations to complete
      await waitFor(() => {
        expect(result.current).toBe('dark');
      });
    });

    it('should return the selected theme when preference is explicitly set', async () => {
      // Mock device color scheme
      (useColorScheme as jest.Mock).mockReturnValue('light');
      
      // Mock the useThemePreference hook to return "dark"
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('dark');
      
      const { result } = renderHook(() => useActualColorScheme());
      
      // Wait for async operations to complete
      await waitFor(() => {
        expect(result.current).toBe('dark');
      });
    });

    it('should update when device color scheme changes and preference is "system"', async () => {
      // Start with light theme
      (useColorScheme as jest.Mock).mockReturnValue('light');
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('system');
      
      const { result, rerender } = renderHook(() => useActualColorScheme());
      
      // Wait for initial setup
      await waitFor(() => {
        expect(result.current).toBe('light');
      });
      
      // Change device theme to dark
      (useColorScheme as jest.Mock).mockReturnValue('dark');
      
      // Rerender to trigger the effect
      rerender();
      
      // Should update to dark
      expect(result.current).toBe('dark');
    });

    it('should not change when device theme changes but preference is explicit', async () => {
      // Start with light device theme, but dark preference
      (useColorScheme as jest.Mock).mockReturnValue('light');
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('dark');
      
      const { result, rerender } = renderHook(() => useActualColorScheme());
      
      // Wait for initial setup
      await waitFor(() => {
        expect(result.current).toBe('dark');
      });
      
      // Change device theme
      (useColorScheme as jest.Mock).mockReturnValue('dark');
      
      // Rerender to trigger the effect
      rerender();
      
      // Should still use the explicit preference (dark)
      expect(result.current).toBe('dark');
    });

    it('should update when theme preference changes', async () => {
      // Mock AsyncStorage for multiple calls
      (AsyncStorage.getItem as jest.Mock).mockImplementation((key) => {
        if (key === 'themePreference') {
          return Promise.resolve('system');
        }
        return Promise.resolve(null);
      });
      
      (useColorScheme as jest.Mock).mockReturnValue('light');
      
      const { result: themeResult } = renderHook(() => useThemePreference());
      const { result: schemeResult } = renderHook(() => useActualColorScheme());
      
      // Wait for initial setups
      await waitFor(() => {
        expect(AsyncStorage.getItem).toHaveBeenCalledTimes(2);
      });
      
      expect(schemeResult.current).toBe('light');
      
      // Change theme preference
      act(() => {
        themeResult.current[1]('dark');
      });
      
      // The actual color scheme should update too
      expect(schemeResult.current).toBe('dark');
    });
  });
});