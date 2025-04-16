import { renderHook } from '@testing-library/react-native';
import { useThemeColor } from '../useThemeColor';
import { Colors } from '@/constants/Colors';
import * as UseColorScheme from '../useColorScheme';

jest.mock('../useColorScheme', () => ({
  useColorScheme: jest.fn()
}));

describe('useThemeColor Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('should return light theme color when theme is light', () => {
    // Mock useColorScheme to return light
    jest.spyOn(UseColorScheme, 'useColorScheme').mockReturnValue('light');
    
    // Call the hook with text color
    const { result } = renderHook(() => useThemeColor({}, 'text'));
    
    // Should return the text color for light theme
    expect(result.current).toBe(Colors.light.text);
  });
  
  it('should return dark theme color when theme is dark', () => {
    // Mock useColorScheme to return dark
    jest.spyOn(UseColorScheme, 'useColorScheme').mockReturnValue('dark');
    
    // Call the hook with text color
    const { result } = renderHook(() => useThemeColor({}, 'text'));
    
    // Should return the text color for dark theme
    expect(result.current).toBe(Colors.dark.text);
  });
  
  it('should return the provided prop color when available for the current theme (light)', () => {
    // Mock useColorScheme to return light
    jest.spyOn(UseColorScheme, 'useColorScheme').mockReturnValue('light');
    
    // Call the hook with custom light color
    const customProps = { light: '#custom-light', dark: '#custom-dark' };
    const { result } = renderHook(() => useThemeColor(customProps, 'text'));
    
    // Should return the custom light color
    expect(result.current).toBe('#custom-light');
  });
  
  it('should return the provided prop color when available for the current theme (dark)', () => {
    // Mock useColorScheme to return dark
    jest.spyOn(UseColorScheme, 'useColorScheme').mockReturnValue('dark');
    
    // Call the hook with custom dark color
    const customProps = { light: '#custom-light', dark: '#custom-dark' };
    const { result } = renderHook(() => useThemeColor(customProps, 'text'));
    
    // Should return the custom dark color
    expect(result.current).toBe('#custom-dark');
  });
  
  it('should return light theme color when theme is null and fallback to light', () => {
    // Mock useColorScheme to return null
    jest.spyOn(UseColorScheme, 'useColorScheme').mockReturnValue(null);
    
    // Call the hook with background color
    const { result } = renderHook(() => useThemeColor({}, 'background'));
    
    // Should return the background color for light theme (fallback)
    expect(result.current).toBe(Colors.light.background);
  });
  
  it('should return light theme color when theme is undefined and fallback to light', () => {
    // Mock useColorScheme to return undefined
    jest.spyOn(UseColorScheme, 'useColorScheme').mockReturnValue(undefined);
    
    // Call the hook with background color
    const { result } = renderHook(() => useThemeColor({}, 'background'));
    
    // Should return the background color for light theme (fallback)
    expect(result.current).toBe(Colors.light.background);
  });
  
  it('should return color from props even if only one theme is provided (light)', () => {
    // Mock useColorScheme to return light
    jest.spyOn(UseColorScheme, 'useColorScheme').mockReturnValue('light');
    
    // Call the hook with only light theme custom color
    const customProps = { light: '#only-light' };
    const { result } = renderHook(() => useThemeColor(customProps, 'text'));
    
    // Should return the custom light color
    expect(result.current).toBe('#only-light');
  });
  
  it('should return color from props even if only one theme is provided (dark)', () => {
    // Mock useColorScheme to return dark
    jest.spyOn(UseColorScheme, 'useColorScheme').mockReturnValue('dark');
    
    // Call the hook with only dark theme custom color
    const customProps = { dark: '#only-dark' };
    const { result } = renderHook(() => useThemeColor(customProps, 'text'));
    
    // Should return the custom dark color
    expect(result.current).toBe('#only-dark');
  });
  
  it('should fallback to theme colors when prop colors are not provided for current theme', () => {
    // Mock useColorScheme to return dark
    jest.spyOn(UseColorScheme, 'useColorScheme').mockReturnValue('dark');
    
    // Call the hook with only light theme custom color
    const customProps = { light: '#only-light' };
    const { result } = renderHook(() => useThemeColor(customProps, 'text'));
    
    // Should return the text color for dark theme (fallback)
    expect(result.current).toBe(Colors.dark.text);
  });
});