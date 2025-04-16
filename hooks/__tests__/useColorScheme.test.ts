import { renderHook } from '@testing-library/react-native';
import * as ReactNative from 'react-native';
import { useColorScheme } from '../useColorScheme';

// Mock the ReactNative useColorScheme hook
jest.mock('react-native', () => ({
  useColorScheme: jest.fn(),
}));

describe('useColorScheme Hook', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  it('should return light theme when system returns light', () => {
    // Setup mock to return light
    (ReactNative.useColorScheme as jest.Mock).mockReturnValue('light');
    
    // Render the hook
    const { result } = renderHook(() => useColorScheme());
    
    // Assert the result
    expect(result.current).toBe('light');
    expect(ReactNative.useColorScheme).toHaveBeenCalled();
  });
  
  it('should return dark theme when system returns dark', () => {
    // Setup mock to return dark
    (ReactNative.useColorScheme as jest.Mock).mockReturnValue('dark');
    
    // Render the hook
    const { result } = renderHook(() => useColorScheme());
    
    // Assert the result
    expect(result.current).toBe('dark');
    expect(ReactNative.useColorScheme).toHaveBeenCalled();
  });
  
  it('should return null when system returns null', () => {
    // Setup mock to return null
    (ReactNative.useColorScheme as jest.Mock).mockReturnValue(null);
    
    // Render the hook
    const { result } = renderHook(() => useColorScheme());
    
    // Assert the result
    expect(result.current).toBeNull();
    expect(ReactNative.useColorScheme).toHaveBeenCalled();
  });
  
  it('should return undefined when system returns undefined', () => {
    // Setup mock to return undefined
    (ReactNative.useColorScheme as jest.Mock).mockReturnValue(undefined);
    
    // Render the hook
    const { result } = renderHook(() => useColorScheme());
    
    // Assert the result
    expect(result.current).toBeUndefined();
    expect(ReactNative.useColorScheme).toHaveBeenCalled();
  });
});