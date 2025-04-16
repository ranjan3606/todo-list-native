import { renderHook } from '@testing-library/react-native';
import { useStableRefresh } from '../useStableRefresh';
import * as ExpoRouter from 'expo-router';

// Mock the useFocusEffect hook
jest.mock('expo-router', () => ({
  useFocusEffect: jest.fn()
}));

describe('useStableRefresh Hook', () => {
  let mockCallback: jest.Mock;
  let storedCallback: () => void;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create a fresh mock for each test
    mockCallback = jest.fn();
    
    // Store the callback for manual triggering instead of auto-executing
    (ExpoRouter.useFocusEffect as jest.Mock).mockImplementation((callback) => {
      storedCallback = callback;
    });
  });
  
  it('should call refresh function when screen comes into focus', () => {
    // Render the hook with mock refresh function
    renderHook(() => useStableRefresh(mockCallback));
    
    // useFocusEffect should have been called
    expect(ExpoRouter.useFocusEffect).toHaveBeenCalled();
    
    // Manually simulate focus
    storedCallback();
    
    // The refresh function should have been called once when focused
    expect(mockCallback).toHaveBeenCalledTimes(1);
  });
  
  it('should maintain stable reference even when function changes', () => {
    // Create a component that changes the callback between renders
    const { rerender } = renderHook(
      ({ refreshFn }) => useStableRefresh(refreshFn),
      { initialProps: { refreshFn: mockCallback } }
    );
    
    // Simulate initial focus
    storedCallback();
    
    // The first callback should have been called
    expect(mockCallback).toHaveBeenCalledTimes(1);
    
    // Create a new mock callback
    const newMockCallback = jest.fn();
    
    // Rerender with a new callback
    rerender({ refreshFn: newMockCallback });
    
    // New callback should not be called yet (only on focus)
    expect(newMockCallback).not.toHaveBeenCalled();
    
    // Simulate focus event again
    storedCallback();
    
    // Now the new callback should be called, showing the ref was updated
    expect(newMockCallback).toHaveBeenCalledTimes(1);
  });
  
  it('should call the latest refresh function even after multiple renders', () => {
    // Create a component that changes the callback between renders
    const { rerender } = renderHook(
      ({ refreshFn }) => useStableRefresh(refreshFn),
      { initialProps: { refreshFn: mockCallback } }
    );
    
    // Simulate initial focus
    storedCallback();
    
    // First callback called on initial focus
    expect(mockCallback).toHaveBeenCalledTimes(1);
    
    // Create a series of new mock callbacks
    const secondCallback = jest.fn();
    const thirdCallback = jest.fn();
    const fourthCallback = jest.fn();
    
    // Rerender with second callback
    rerender({ refreshFn: secondCallback });
    
    // Rerender with third callback
    rerender({ refreshFn: thirdCallback });
    
    // Rerender with fourth callback
    rerender({ refreshFn: fourthCallback });
    
    // No callbacks should have been called yet without focus
    expect(secondCallback).not.toHaveBeenCalled();
    expect(thirdCallback).not.toHaveBeenCalled();
    expect(fourthCallback).not.toHaveBeenCalled();
    
    // Simulate focus event again
    storedCallback();
    
    // Only the latest callback should be called
    expect(secondCallback).not.toHaveBeenCalled();
    expect(thirdCallback).not.toHaveBeenCalled();
    expect(fourthCallback).toHaveBeenCalledTimes(1);
  });
  
  it('should return a cleanup function from useFocusEffect', () => {
    // Render the hook
    renderHook(() => useStableRefresh(mockCallback));
    
    // Execute the callback to get the cleanup function
    const cleanup = storedCallback();
    
    // It should return a function (empty function in this case)
    expect(typeof cleanup).toBe('function');
  });
});