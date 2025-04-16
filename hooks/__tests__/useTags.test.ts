import { renderHook, act } from '@testing-library/react-native';
import { Animated } from 'react-native';
import { useTags } from '../useTags';
import { getTags } from '@/services/storage';
import { todoEvents, TODO_EVENTS } from '@/services/eventEmitter';
import { PREDEFINED_TAGS } from '@/constants/Tags';

// Mock the dependencies
jest.mock('@/services/storage', () => ({
  getTags: jest.fn(),
}));

jest.mock('@/services/eventEmitter', () => ({
  TODO_EVENTS: {
    TAG_ADDED: 'tag-added',
    TAG_UPDATED: 'tag-updated',
    TAG_DELETED: 'tag-deleted',
    TAGS_CHANGED: 'tags-changed'
  },
  todoEvents: {
    emit: jest.fn(),
    on: jest.fn().mockImplementation(() => jest.fn()), // Return unsubscribe function
  }
}));

jest.mock('@/constants/Tags', () => ({
  PREDEFINED_TAGS: {
    'work': ['job', 'office', 'project'],
    'personal': ['home', 'family', 'self'],
    'urgent': ['important', 'deadline', 'critical']
  }
}));

// Mock Animated.Value and timing
jest.mock('react-native', () => {
  // Define a simple mockValue class instead of using requireActual
  class MockAnimatedValue {
    value: number;
    setValue: jest.Mock;
    
    constructor(value: number) {
      this.value = value;
      this.setValue = jest.fn().mockImplementation((val) => {
        this.value = val;
      });
    }
  }
  
  const mockTiming = jest.fn().mockImplementation(() => ({
    start: jest.fn().mockImplementation((callback) => {
      if (callback) callback({ finished: true });
    }),
  }));

  // Create a minimal mock of react-native without using requireActual
  return {
    Animated: {
      Value: jest.fn().mockImplementation((value) => new MockAnimatedValue(value)),
      timing: mockTiming,
      // Add any other Animated methods that might be used
      View: 'Animated.View',
      Text: 'Animated.Text',
    },
    View: 'View',
    Text: 'Text',
    // Add any other RN components used in the tests
  };
});

describe('useTags Hook', () => {
  // Sample tag data for testing
  const mockTags = {
    'work': ['job', 'office', 'meeting'],
    'health': ['exercise', 'diet', 'wellness'],
    'leisure': ['hobby', 'fun', 'relax']
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementation to return tags
    (getTags as jest.Mock).mockResolvedValue(mockTags);
    
    // Setup mock event emitter
    const eventCallbacks: Record<string, Function[]> = {};
    
    (todoEvents.on as jest.Mock).mockImplementation((event, callback) => {
      if (!eventCallbacks[event]) {
        eventCallbacks[event] = [];
      }
      eventCallbacks[event].push(callback);
      
      // Return unsubscribe function that removes the callback
      return () => {
        if (eventCallbacks[event]) {
          const index = eventCallbacks[event].indexOf(callback);
          if (index !== -1) {
            eventCallbacks[event].splice(index, 1);
          }
        }
      };
    });
    
    (todoEvents.emit as jest.Mock).mockImplementation((event, ...args) => {
      if (eventCallbacks[event]) {
        eventCallbacks[event].forEach(callback => callback(...args));
      }
    });
  });
  
  it('should fetch tags on initial render', async () => {
    const { result } = renderHook(() => useTags());
    
    // Initially should be loading with empty tags object
    expect(result.current.isLoading).toBe(true);
    expect(result.current.tags).toEqual({});
    
    // Wait for promises to resolve
    await act(async () => {
      await Promise.resolve();
    });
    
    // After loading, should have tags and not be loading
    expect(result.current.isLoading).toBe(false);
    expect(result.current.tags).toEqual(mockTags);
    expect(getTags).toHaveBeenCalledTimes(1);
  });
  
  it('should use predefined tags when storage returns empty object', async () => {
    // Mock empty tags result
    (getTags as jest.Mock).mockResolvedValue({});
    
    const { result } = renderHook(() => useTags());
    
    await act(async () => {
      await Promise.resolve();
    });
    
    // Should use predefined tags when storage returns empty
    expect(result.current.tags).toEqual(PREDEFINED_TAGS);
  });
  
  it('should initialize animation values for each tag', async () => {
    const { result } = renderHook(() => useTags());
    
    await act(async () => {
      await Promise.resolve();
    });
    
    // Should have animation values for each tag
    Object.keys(mockTags).forEach(tagName => {
      expect(result.current.slideAnim[tagName]).toBeDefined();
    });
  });
  
  it('should refresh tags when tag events are emitted', async () => {
    const { result } = renderHook(() => useTags());
    
    await act(async () => {
      await Promise.resolve();
    });
    
    // Clear the mock calls to getTags
    (getTags as jest.Mock).mockClear();
    
    // Change mockTags to return different data on next call
    const updatedTags = { ...mockTags, 'new-tag': ['fresh', 'added'] };
    (getTags as jest.Mock).mockResolvedValue(updatedTags);
    
    // Emit a TAG_ADDED event
    await act(async () => {
      todoEvents.emit(TODO_EVENTS.TAG_ADDED);
      await Promise.resolve();
    });
    
    // Verify getTags was called and tags were updated
    expect(getTags).toHaveBeenCalled();
    expect(result.current.tags).toEqual(updatedTags);
  });
  
  it('should handle tag press and toggle animation', async () => {
    // Spy on Animated.timing
    const animatedTimingSpy = jest.spyOn(Animated, 'timing');
    
    const { result } = renderHook(() => useTags());
    
    await act(async () => {
      await Promise.resolve();
    });
    
    // Initially no tag should be active
    expect(result.current.activeTag).toBeNull();
    
    // Press a tag
    await act(async () => {
      result.current.handleTagPress('work');
    });
    
    // The tag should be activated and animation started
    expect(result.current.activeTag).toBe('work');
    expect(animatedTimingSpy).toHaveBeenCalled();
    expect(animatedTimingSpy.mock.calls[0][1].toValue).toBe(0); // Showing (0 = visible)
    
    // Press the same tag again
    await act(async () => {
      result.current.handleTagPress('work');
    });
    
    // The tag should be deactivated and animation started
    expect(result.current.activeTag).toBeNull();
    expect(animatedTimingSpy).toHaveBeenCalledTimes(2);
    expect(animatedTimingSpy.mock.calls[1][1].toValue).toBe(100); // Hiding (100 = off-screen)
  });
  
  it('should close previously active tag when opening a new one', async () => {
    // Spy on Animated.timing
    const animatedTimingSpy = jest.spyOn(Animated, 'timing');
    
    const { result } = renderHook(() => useTags());
    
    await act(async () => {
      await Promise.resolve();
    });
    
    // Activate first tag
    await act(async () => {
      result.current.handleTagPress('work');
    });
    
    // The first tag should be active
    expect(result.current.activeTag).toBe('work');
    expect(animatedTimingSpy).toHaveBeenCalledTimes(1);
    
    // Now activate a different tag
    await act(async () => {
      result.current.handleTagPress('health');
    });
    
    // The second tag should now be active
    expect(result.current.activeTag).toBe('health');
    
    // Two more animations should have occurred:
    // 1. Closing the first tag
    // 2. Opening the second tag
    expect(animatedTimingSpy).toHaveBeenCalledTimes(3);
    
    // First new animation call should be closing the previous tag
    expect(animatedTimingSpy.mock.calls[1][1].toValue).toBe(100); // Hiding previous tag
    
    // Second new animation call should be opening the new tag
    expect(animatedTimingSpy.mock.calls[2][1].toValue).toBe(0); // Showing new tag
  });
  
  it('should handle manual refresh function call', async () => {
    const { result } = renderHook(() => useTags());
    
    await act(async () => {
      await Promise.resolve();
    });
    
    // Clear the mock calls
    (getTags as jest.Mock).mockClear();
    
    // Change mockTags to return different data on next call
    const updatedTags = { ...mockTags, 'refreshed-tag': ['manual', 'refresh'] };
    (getTags as jest.Mock).mockResolvedValue(updatedTags);
    
    // Call refresh manually
    await act(async () => {
      await result.current.refresh();
    });
    
    // Should have fetched tags again
    expect(getTags).toHaveBeenCalledTimes(1);
    expect(result.current.tags).toEqual(updatedTags);
  });
  
  it('should support all tag-related events', async () => {
    const { result } = renderHook(() => useTags());
    
    await act(async () => {
      await Promise.resolve();
    });
    
    // Test each event type
    for (const eventType of [
      TODO_EVENTS.TAG_ADDED,
      TODO_EVENTS.TAG_UPDATED,
      TODO_EVENTS.TAG_DELETED,
      TODO_EVENTS.TAGS_CHANGED
    ]) {
      // Reset the mock completely before each event
      (getTags as jest.Mock).mockClear();
      
      // Emit the event
      await act(async () => {
        todoEvents.emit(eventType);
        await Promise.resolve();
      });
      
      // The function should be called at least once for each event
      // Some events might trigger multiple refreshes depending on implementation
      expect(getTags).toHaveBeenCalled();
    }
  });
});