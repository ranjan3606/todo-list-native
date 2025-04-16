import { renderHook, act } from '@testing-library/react-native';
import * as ReactNative from 'react-native';
import { useColorScheme } from '../useColorScheme.web';

// Mock the ReactNative useColorScheme hook
jest.mock('react-native', () => ({
  useColorScheme: jest.fn(),
}));

describe('useColorScheme Web Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });
  
  afterEach(() => {
    jest.useRealTimers();
  });
  
  it('should initially return light theme regardless of system theme before hydration', () => {
    // Setup mock to return dark (which should be ignored before hydration)
    (ReactNative.useColorScheme as jest.Mock).mockReturnValue('dark');
    
    // Render the hook
    const { result } = renderHook(() => useColorScheme());
    
    // Before hydration, it should always return light
    expect(result.current).toBe('light');
  });
  
  it('should return system theme after hydration when system theme is light', async () => {
    // Setup mock to return light
    (ReactNative.useColorScheme as jest.Mock).mockReturnValue('light');
    
    // Render the hook
    const { result } = renderHook(() => useColorScheme());
    
    // Initially should be light (default)
    expect(result.current).toBe('light');
    
    // Trigger the useEffect for hydration
    await act(async () => {
      // This simulates the component mounting and the useEffect running
      jest.advanceTimersByTime(0);
    });
    
    // After hydration, should match system theme (light)
    expect(result.current).toBe('light');
  });
  
  fit('should return system theme after hydration when system theme is dark', async () => {
    // Setup mock to return dark
    (ReactNative.useColorScheme as jest.Mock).mockReturnValue('dark');
    
    // Render the hook
    const { result } = renderHook(() => useColorScheme());
    
    // Initially should be light (default)
    expect(result.current).toBe('light');
    
    // Trigger the useEffect for hydration
    await act(async () => {
      // This simulates the component mounting and the useEffect running
      jest.advanceTimersByTime(0);
    });
    
    // After hydration, should match system theme (dark)
    expect(result.current).toBe('dark');
  });
  
  it('should handle null system theme after hydration', async () => {
    // Setup mock to return null
    (ReactNative.useColorScheme as jest.Mock).mockReturnValue(null);
    
    // Render the hook
    const { result } = renderHook(() => useColorScheme());
    
    // Initially should be light (default)
    expect(result.current).toBe('light');
    
    // Trigger the useEffect for hydration
    await act(async () => {
      // This simulates the component mounting and the useEffect running
      jest.advanceTimersByTime(0);
    });
    
    // After hydration, should match system theme (null)
    expect(result.current).toBeNull();
  });
  
  it('should update when system theme changes after hydration', async () => {
    // Initially return light
    (ReactNative.useColorScheme as jest.Mock).mockReturnValue('light');
    
    // Render the hook
    const { result, rerender } = renderHook(() => useColorScheme());
    
    // Trigger the useEffect for hydration
    await act(async () => {
      // This simulates the component mounting and the useEffect running
      jest.advanceTimersByTime(0);
    });
    
    // After hydration, should be light
    expect(result.current).toBe('light');
    
    // Change system theme to dark
    (ReactNative.useColorScheme as jest.Mock).mockReturnValue('dark');
    
    // Rerender the hook - passing in the same hook function
    rerender(() => useColorScheme());
    
    // Should now reflect dark theme
    expect(result.current).toBe('dark');
  });
  
  it('should not update hydration state on unmount', () => {
    // Setup mock to return dark
    (ReactNative.useColorScheme as jest.Mock).mockReturnValue('dark');
    
    // Render the hook
    const { result, unmount } = renderHook(() => useColorScheme());
    
    // Initially should be light (default)
    expect(result.current).toBe('light');
    
    // Unmount the hook
    unmount();
    
    // Should still be light as hydration hasn't happened
    expect(result.current).toBe('light');
  });
});